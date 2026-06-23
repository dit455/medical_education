"""One-off cleanup: merges duplicate tbl_course_master rows (same name,
case-insensitive) created before the create-course endpoint started
reusing existing rows. For each duplicate group, keeps the lowest course_id,
re-points tbl_inst_course_map / tbl_course_subject_map rows to it (dropping
any that would violate the tables' unique constraints), then deletes the
extra course_master rows.

Run once with: backend/venv/Scripts/python.exe backend/scripts/dedupe_courses.py
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
            SELECT LOWER(TRIM(course_desc)) AS key_, GROUP_CONCAT(course_id ORDER BY course_id) AS ids
            FROM tbl_course_master
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
                # Carry over board visibility from the duplicate onto the keeper.
                cursor.execute(
                    "SELECT bome_status, boen_status FROM tbl_course_master WHERE course_id = %s",
                    (dup_id,),
                )
                dup_bome, dup_boen = cursor.fetchone()
                cursor.execute(
                    """
                    UPDATE tbl_course_master
                    SET bome_status = GREATEST(bome_status, %s),
                        boen_status = GREATEST(boen_status, %s)
                    WHERE course_id = %s
                    """,
                    (dup_bome or 0, dup_boen or 0, keeper),
                )

                # Re-point institution mappings, dropping any that would
                # collide with a mapping the keeper already has.
                cursor.execute(
                    "SELECT inst_id FROM tbl_inst_course_map WHERE course_id = %s",
                    (dup_id,),
                )
                for (inst_id,) in cursor.fetchall():
                    cursor.execute(
                        "SELECT 1 FROM tbl_inst_course_map WHERE inst_id = %s AND course_id = %s",
                        (inst_id, keeper),
                    )
                    if cursor.fetchone():
                        cursor.execute(
                            "DELETE FROM tbl_inst_course_map WHERE inst_id = %s AND course_id = %s",
                            (inst_id, dup_id),
                        )
                    else:
                        cursor.execute(
                            "UPDATE tbl_inst_course_map SET course_id = %s WHERE inst_id = %s AND course_id = %s",
                            (keeper, inst_id, dup_id),
                        )

                # Re-point subject mappings, dropping any that would collide
                # with a (subject, year, sem) the keeper already has.
                cursor.execute(
                    "SELECT subject_id, year_id, sem_id FROM tbl_course_subject_map WHERE course_id = %s",
                    (dup_id,),
                )
                for subject_id, year_id, sem_id in cursor.fetchall():
                    cursor.execute(
                        """
                        SELECT 1 FROM tbl_course_subject_map
                        WHERE course_id = %s AND subject_id = %s AND year_id = %s AND sem_id = %s
                        """,
                        (keeper, subject_id, year_id, sem_id),
                    )
                    if cursor.fetchone():
                        cursor.execute(
                            """
                            DELETE FROM tbl_course_subject_map
                            WHERE course_id = %s AND subject_id = %s AND year_id = %s AND sem_id = %s
                            """,
                            (dup_id, subject_id, year_id, sem_id),
                        )
                    else:
                        cursor.execute(
                            """
                            UPDATE tbl_course_subject_map SET course_id = %s
                            WHERE course_id = %s AND subject_id = %s AND year_id = %s AND sem_id = %s
                            """,
                            (keeper, dup_id, subject_id, year_id, sem_id),
                        )

                cursor.execute("DELETE FROM tbl_course_master WHERE course_id = %s", (dup_id,))

        conn.commit()
        cursor.close()
        print(f"Done - merged {len(groups)} duplicate group(s).")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
