"""CRUD for tbl_student_marks, scoped to one student.

Not wired into the active frontend yet - see routes/students.py for context.
"""

from flask import Blueprint, jsonify, request

from db import get_connection
from utils import actor_from_body

marks_bp = Blueprint("marks", __name__)


def _marks_row_to_dict(row):
    mark_id, student_id, subject_id, internal_marks, exam_marks, result, status_ = row
    return {
        "id": mark_id,
        "studentId": student_id,
        "subjectId": subject_id,
        "internal": internal_marks,
        "exam": exam_marks,
        "result": result,
        "status": status_,
    }


MARKS_SELECT_SQL = """
    SELECT mark_id, student_id, subject_id, internal_marks, exam_marks, result, status_
    FROM tbl_student_marks
"""


def apply_create_marks(cursor, student_id, subject_id, internal=None, exam=None,
                        result=None, status_label="Active", actor="system"):
    cursor.execute(
        """
        INSERT INTO tbl_student_marks
            (student_id, subject_id, internal_marks, exam_marks, result,
             created_by, created_date, status_)
        VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
        """,
        (student_id, subject_id, internal, exam, result, actor, status_label),
    )
    mark_id = cursor.lastrowid
    cursor.execute(MARKS_SELECT_SQL + " WHERE mark_id = %s", (mark_id,))
    return _marks_row_to_dict(cursor.fetchone())


def apply_update_marks(cursor, mark_id, internal=None, exam=None, result=None,
                        status_label="Active", actor="system"):
    cursor.execute(
        """
        UPDATE tbl_student_marks
        SET internal_marks = %s, exam_marks = %s, result = %s, status_ = %s,
            updated_by = %s, updated_date = NOW()
        WHERE mark_id = %s
        """,
        (internal, exam, result, status_label, actor, mark_id),
    )
    cursor.execute(MARKS_SELECT_SQL + " WHERE mark_id = %s", (mark_id,))
    row = cursor.fetchone()
    if row is None:
        raise ValueError("marks record not found")
    return _marks_row_to_dict(row)


def apply_delete_marks(cursor, mark_id):
    cursor.execute("DELETE FROM tbl_student_marks WHERE mark_id = %s", (mark_id,))


@marks_bp.route("/api/students/<int:student_id>/marks", methods=["GET"])
def get_marks_for_student(student_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(MARKS_SELECT_SQL + " WHERE student_id = %s", (student_id,))
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_marks_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@marks_bp.route("/api/students/<int:student_id>/marks", methods=["POST"])
def create_marks(student_id):
    body = request.get_json(force=True) or {}
    conn = get_connection()
    try:
        cursor = conn.cursor()
        result = apply_create_marks(
            cursor, student_id, body.get("subjectId"), body.get("internal"), body.get("exam"),
            body.get("result"), body.get("status", "Active"), actor_from_body(body),
        )
        conn.commit()
        cursor.close()
        return jsonify(result), 201
    finally:
        conn.close()


@marks_bp.route("/api/marks/<int:mark_id>", methods=["PUT"])
def update_marks(mark_id):
    body = request.get_json(force=True) or {}
    conn = get_connection()
    try:
        cursor = conn.cursor()
        try:
            result = apply_update_marks(
                cursor, mark_id, body.get("internal"), body.get("exam"), body.get("result"),
                body.get("status", "Active"), actor_from_body(body),
            )
        except ValueError as exc:
            cursor.close()
            return jsonify({"error": str(exc)}), 404
        conn.commit()
        cursor.close()
        return jsonify(result)
    finally:
        conn.close()


@marks_bp.route("/api/marks/<int:mark_id>", methods=["DELETE"])
def delete_marks(mark_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        apply_delete_marks(cursor, mark_id)
        conn.commit()
        cursor.close()
        return jsonify({"ok": True})
    finally:
        conn.close()
