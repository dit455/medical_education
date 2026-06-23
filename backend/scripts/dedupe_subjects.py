"""One-off cleanup: merges duplicate tbl_subject_master rows (same name,
case-insensitive) created before the create-subject endpoint started
reusing existing rows. For each duplicate group, keeps the lowest subject_id,
re-points tbl_course_subject_map rows to it (dropping any that would
violate the table's unique constraint), then deletes the extra rows.

Run once with: backend/venv/Scripts/python.exe backend/scripts/dedupe_subjects.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv()

from db import get_connection


def main():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT LOWER(TRIM(subject_desc)) AS key_, GROUP_CONCAT(subject_id ORDER BY subject_id) AS ids
            FROM tbl_subject_master
            GROUP BY key_
            HAVING COUNT(*) > 1
            """
        )
        groups = cursor.fetchall()

        for key_, ids_csv in groups:
            ids = [int(i) for i in ids_csv.split(",")]
            keeper, duplicates = ids[0], ids[1:]
            print(f"'{key_}': keeping {keeper}, merging {duplicates}")

            for dup_id in duplicates:
                cursor.execute(
                    "SELECT bome_status, boen_status FROM tbl_subject_master WHERE subject_id = %s",
                    (dup_id,),
                )
                dup_bome, dup_boen = cursor.fetchone()
                cursor.execute(
                    """
                    UPDATE tbl_subject_master
                    SET bome_status = GREATEST(bome_status, %s),
                        boen_status = GREATEST(boen_status, %s)
                    WHERE subject_id = %s
                    """,
                    (dup_bome or 0, dup_boen or 0, keeper),
                )

                # Re-point course/year/sem mappings, dropping any that would
                # collide with a mapping the keeper already has.
                cursor.execute(
                    "SELECT course_id, year_id, sem_id FROM tbl_course_subject_map WHERE subject_id = %s",
                    (dup_id,),
                )
                for course_id, year_id, sem_id in cursor.fetchall():
                    cursor.execute(
                        """
                        SELECT 1 FROM tbl_course_subject_map
                        WHERE course_id = %s AND subject_id = %s AND year_id = %s AND sem_id = %s
                        """,
                        (course_id, keeper, year_id, sem_id),
                    )
                    if cursor.fetchone():
                        cursor.execute(
                            """
                            DELETE FROM tbl_course_subject_map
                            WHERE course_id = %s AND subject_id = %s AND year_id = %s AND sem_id = %s
                            """,
                            (course_id, dup_id, year_id, sem_id),
                        )
                    else:
                        cursor.execute(
                            """
                            UPDATE tbl_course_subject_map SET subject_id = %s
                            WHERE course_id = %s AND subject_id = %s AND year_id = %s AND sem_id = %s
                            """,
                            (keeper, course_id, dup_id, year_id, sem_id),
                        )

                cursor.execute("DELETE FROM tbl_subject_master WHERE subject_id = %s", (dup_id,))

        conn.commit()
        cursor.close()
        print(f"Done - merged {len(groups)} duplicate group(s).")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
