"""Daily database backup for the EMS portal.

Writes a timestamped .sql file into backend/dump/ using mysqldump when it is
available on PATH, and falling back to a pure-Python dump (mysql.connector)
when it is not. Old backups are deleted after KEEP_DAYS days.

Run it by hand:      python scripts/db_backup.py
Run it every day:    see the Task Scheduler / cron steps in the chat answer.
"""

import os
import shutil
import subprocess
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

import mysql.connector

KEEP_DAYS = 30
DUMP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dump")

DB = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("DB_PORT", "3306")),
    "user": os.environ.get("DB_USER", "root"),
    "password": os.environ.get("DB_PASSWORD", "admin123"),
    "database": os.environ.get("DB_NAME", "ems_dev"),
}


def log(message):
    print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] {message}", flush=True)


def backup_with_mysqldump(out_path):
    """Returns True if mysqldump exists and finished successfully."""
    exe = shutil.which("mysqldump")
    if not exe:
        return False

    cmd = [
        exe,
        f"--host={DB['host']}",
        f"--port={DB['port']}",
        f"--user={DB['user']}",
        f"--password={DB['password']}",
        "--single-transaction",
        "--routines",
        "--events",
        "--default-character-set=utf8mb4",
        DB["database"],
    ]
    with open(out_path, "w", encoding="utf-8") as handle:
        result = subprocess.run(cmd, stdout=handle, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        log(f"mysqldump failed: {result.stderr.strip()}")
        if os.path.exists(out_path):
            os.remove(out_path)
        return False
    return True


def sql_value(value):
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, (bytes, bytearray)):
        return "0x" + value.hex()
    text = str(value).replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r")
    return f"'{text}'"


def backup_with_python(out_path):
    """Fallback dump: CREATE TABLE + INSERT statements for every table."""
    conn = mysql.connector.connect(**DB)
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    tables = [row[0] for row in cursor.fetchall()]

    with open(out_path, "w", encoding="utf-8") as handle:
        handle.write(f"-- EMS backup of `{DB['database']}` taken {datetime.now():%Y-%m-%d %H:%M:%S}\n")
        handle.write("SET FOREIGN_KEY_CHECKS=0;\n\n")
        for table in tables:
            cursor.execute(f"SHOW CREATE TABLE `{table}`")
            create_sql = cursor.fetchone()[1]
            handle.write(f"DROP TABLE IF EXISTS `{table}`;\n{create_sql};\n\n")

            cursor.execute(f"SELECT * FROM `{table}`")
            rows = cursor.fetchall()
            if not rows:
                continue
            columns = ", ".join(f"`{c[0]}`" for c in cursor.description)
            for row in rows:
                values = ", ".join(sql_value(v) for v in row)
                handle.write(f"INSERT INTO `{table}` ({columns}) VALUES ({values});\n")
            handle.write("\n")
        handle.write("SET FOREIGN_KEY_CHECKS=1;\n")

    cursor.close()
    conn.close()
    return True


def delete_old_backups():
    cutoff = datetime.now() - timedelta(days=KEEP_DAYS)
    for name in os.listdir(DUMP_DIR):
        path = os.path.join(DUMP_DIR, name)
        if not name.endswith(".sql") or not os.path.isfile(path):
            continue
        if datetime.fromtimestamp(os.path.getmtime(path)) < cutoff:
            os.remove(path)
            log(f"Deleted old backup {name}")


def main():
    os.makedirs(DUMP_DIR, exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m-%d_%H%M")
    out_path = os.path.join(DUMP_DIR, f"{DB['database']}_{stamp}.sql")

    log(f"Backing up `{DB['database']}` to {out_path}")
    try:
        if not backup_with_mysqldump(out_path):
            log("mysqldump not usable - falling back to the Python dump.")
            backup_with_python(out_path)
    except Exception as exc:
        log(f"BACKUP FAILED: {exc}")
        if os.path.exists(out_path) and os.path.getsize(out_path) == 0:
            os.remove(out_path)
        return 1

    size_kb = os.path.getsize(out_path) / 1024
    log(f"Backup finished ({size_kb:.1f} KB)")
    delete_old_backups()
    return 0


if __name__ == "__main__":
    sys.exit(main())