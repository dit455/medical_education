"""CRUD for tbl_subject_master and tbl_course_subject_map (Subjects table).

The apply_* functions take an open cursor and do the actual writes without
committing - shared by the HTTP routes below and by the pending-changes
approval dispatcher (routes/approvals.py).
"""

from flask import Blueprint, jsonify, request

from db import get_connection
from utils import actor_from_body, label_to_status, status_to_label

subjects_bp = Blueprint("subjects", __name__)


def _subject_row_to_dict(row):
    course_subject_id, subject_desc, year_desc, sem_desc, priority_id, status_ = row
    return {
        "id": course_subject_id,
        "subject": subject_desc,
        "year": year_desc,
        "semester": sem_desc,
        "priority": priority_id,
        "status": status_to_label(status_),
    }


SUBJECT_SELECT_SQL = """
    SELECT m.course_subject_id, s.subject_desc, y.year_desc, e.sem_desc,
           m.priority_id, m.status_
    FROM tbl_course_subject_map m
    JOIN tbl_subject_master s ON s.subject_id = m.subject_id
    JOIN tbl_year_id y ON y.year_id = m.year_id
    JOIN tbl_exam_sem_master e ON e.sem_id = m.sem_id
"""


def apply_create_subject(cursor, course_id, subject, year_id, sem_id, priority=None,
                          status_label="Active", actor="system"):
    subject = (subject or "").strip()
    status_ = label_to_status(status_label)

    cursor.execute(
        "SELECT bome_status, boen_status FROM tbl_course_master WHERE course_id = %s",
        (course_id,),
    )
    course_row = cursor.fetchone()
    if course_row is None:
        raise ValueError("course not found")
    bome_status, boen_status = course_row
    column = "bome_status" if bome_status and bome_status > 0 else "boen_status"
    other_column = "boen_status" if column == "bome_status" else "bome_status"

    # Reuse the existing subject master row if one with this name already
    # exists (case-insensitive) instead of inserting a duplicate.
    cursor.execute(
        "SELECT subject_id FROM tbl_subject_master WHERE LOWER(subject_desc) = LOWER(%s)",
        (subject,),
    )
    existing = cursor.fetchone()

    cursor.fetchall()

    if existing:
        subject_id = existing[0]
        cursor.execute(
            f"UPDATE tbl_subject_master SET {column} = 1 WHERE subject_id = %s",
            (subject_id,),
        )
    else:
        cursor.execute("SELECT COALESCE(MAX(subject_id), 0) + 1 FROM tbl_subject_master")
        subject_id = cursor.fetchone()[0]
        cursor.execute(
            f"""
            INSERT INTO tbl_subject_master
                (subject_id, subject_desc, {column}, {other_column},
                 created_by, created_date, status_)
            VALUES (%s, %s, 1, 0, %s, NOW(), %s)
            """,
            (subject_id, subject, actor, status_),
        )

    # Don't create a second mapping row if this subject is already mapped to
    # the same course/year/semester.
    cursor.execute(
        """
        SELECT course_subject_id FROM tbl_course_subject_map
        WHERE course_id = %s AND subject_id = %s AND year_id = %s AND sem_id = %s
        """,
        (course_id, subject_id, year_id, sem_id),
    )
    existing_map = cursor.fetchone()

    if existing_map:
        map_id = existing_map[0]
    else:
        cursor.execute(
            "SELECT COALESCE(MAX(course_subject_id), 0) + 1 FROM tbl_course_subject_map"
        )
        map_id = cursor.fetchone()[0]
        cursor.execute(
            """
            INSERT INTO tbl_course_subject_map
                (course_subject_id, course_id, subject_id, year_id, sem_id,
                 priority_id, created_by, created_date, status_)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s)
            """,
            (map_id, course_id, subject_id, year_id, sem_id, priority, actor, status_),
        )

    cursor.execute(SUBJECT_SELECT_SQL + " WHERE m.course_subject_id = %s", (map_id,))
    return _subject_row_to_dict(cursor.fetchone())


def apply_update_subject(cursor, course_subject_id, subject, year_id, sem_id,
                          priority=None, status_label="Active", actor="system"):
    status_ = label_to_status(status_label)

    cursor.execute(
        "SELECT subject_id FROM tbl_course_subject_map WHERE course_subject_id = %s",
        (course_subject_id,),
    )
    map_row = cursor.fetchone()
    if map_row is None:
        raise ValueError("subject mapping not found")
    subject_id = map_row[0]

    cursor.execute(
        """
        UPDATE tbl_subject_master
        SET subject_desc = %s, updated_by = %s, updated_date = NOW()
        WHERE subject_id = %s
        """,
        (subject, actor, subject_id),
    )
    cursor.execute(
        """
        UPDATE tbl_course_subject_map
        SET year_id = %s, sem_id = %s, priority_id = %s, status_ = %s,
            updated_by = %s, updated_date = NOW()
        WHERE course_subject_id = %s
        """,
        (year_id, sem_id, priority, status_, actor, course_subject_id),
    )

    cursor.execute(SUBJECT_SELECT_SQL + " WHERE m.course_subject_id = %s", (course_subject_id,))
    return _subject_row_to_dict(cursor.fetchone())


def apply_delete_subject(cursor, course_subject_id):
    # Only removes this course's mapping to the subject - the subject master
    # row stays untouched since other courses may still be mapped to it.
    cursor.execute(
        "DELETE FROM tbl_course_subject_map WHERE course_subject_id = %s",
        (course_subject_id,),
    )


@subjects_bp.route("/api/courses/<int:course_id>/subjects", methods=["GET"])
def get_subjects_for_course(course_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            SUBJECT_SELECT_SQL + " WHERE m.course_id = %s", (course_id,)
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_subject_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@subjects_bp.route("/api/courses/<int:course_id>/subjects", methods=["POST"])
def create_subject_for_course(course_id):
    body = request.get_json(force=True) or {}
    conn = get_connection()
    try:
        cursor = conn.cursor(buffered=True)
        try:
            result = apply_create_subject(
                cursor, course_id, body.get("subject"), body.get("year_id"), body.get("sem_id"),
                body.get("priority"), body.get("status", "Active"), actor_from_body(body),
            )
        except ValueError as exc:
            cursor.close()
            return jsonify({"error": str(exc)}), 404
        conn.commit()
        cursor.close()
        return jsonify(result), 201
    finally:
        conn.close()


@subjects_bp.route("/api/subjects/<int:course_subject_id>", methods=["PUT"])
def update_subject(course_subject_id):
    body = request.get_json(force=True) or {}
    conn = get_connection()
    try:
        cursor = conn.cursor()
        try:
            result = apply_update_subject(
                cursor, course_subject_id, body.get("subject"), body.get("year_id"), body.get("sem_id"),
                body.get("priority"), body.get("status", "Active"), actor_from_body(body),
            )
        except ValueError as exc:
            cursor.close()
            return jsonify({"error": str(exc)}), 404
        conn.commit()
        cursor.close()
        return jsonify(result)
    finally:
        conn.close()


@subjects_bp.route("/api/subjects/<int:course_subject_id>", methods=["DELETE"])
def delete_subject(course_subject_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        apply_delete_subject(cursor, course_subject_id)
        conn.commit()
        cursor.close()
        return jsonify({"ok": True})
    finally:
        conn.close()
