"""CRUD for tbl_attendance, scoped to one student.

Not wired into the active frontend yet - see routes/students.py for context.
"""

from flask import Blueprint, jsonify, request

from db import get_connection
from utils import actor_from_body

attendance_bp = Blueprint("attendance", __name__)


def _attendance_row_to_dict(row):
    attendance_id, student_id, subject_id, exam_type, attendance_status, status_ = row
    return {
        "id": attendance_id,
        "studentId": student_id,
        "subjectId": subject_id,
        "examType": exam_type,
        "attendance": attendance_status,
        "status": status_,
    }


ATTENDANCE_SELECT_SQL = """
    SELECT attendance_id, student_id, subject_id, exam_type, attendance_status, status_
    FROM tbl_attendance
"""


def apply_create_attendance(cursor, student_id, subject_id, exam_type, attendance_status,
                             status_label="Active", actor="system"):
    cursor.execute(
        """
        INSERT INTO tbl_attendance
            (student_id, subject_id, exam_type, attendance_status,
             created_by, created_date, status_)
        VALUES (%s, %s, %s, %s, %s, NOW(), %s)
        """,
        (student_id, subject_id, exam_type, attendance_status, actor, status_label),
    )
    attendance_id = cursor.lastrowid
    cursor.execute(ATTENDANCE_SELECT_SQL + " WHERE attendance_id = %s", (attendance_id,))
    return _attendance_row_to_dict(cursor.fetchone())


def apply_update_attendance(cursor, attendance_id, attendance_status=None,
                             status_label="Active", actor="system"):
    cursor.execute(
        """
        UPDATE tbl_attendance
        SET attendance_status = %s, status_ = %s, updated_by = %s, updated_date = NOW()
        WHERE attendance_id = %s
        """,
        (attendance_status, status_label, actor, attendance_id),
    )
    cursor.execute(ATTENDANCE_SELECT_SQL + " WHERE attendance_id = %s", (attendance_id,))
    row = cursor.fetchone()
    if row is None:
        raise ValueError("attendance record not found")
    return _attendance_row_to_dict(row)


def apply_delete_attendance(cursor, attendance_id):
    cursor.execute("DELETE FROM tbl_attendance WHERE attendance_id = %s", (attendance_id,))


@attendance_bp.route("/api/students/<int:student_id>/attendance", methods=["GET"])
def get_attendance_for_student(student_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(ATTENDANCE_SELECT_SQL + " WHERE student_id = %s", (student_id,))
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_attendance_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@attendance_bp.route("/api/students/<int:student_id>/attendance", methods=["POST"])
def create_attendance(student_id):
    body = request.get_json(force=True) or {}
    conn = get_connection()
    try:
        cursor = conn.cursor()
        result = apply_create_attendance(
            cursor, student_id, body.get("subjectId"), body.get("examType"), body.get("attendance"),
            body.get("status", "Active"), actor_from_body(body),
        )
        conn.commit()
        cursor.close()
        return jsonify(result), 201
    finally:
        conn.close()


@attendance_bp.route("/api/attendance/<int:attendance_id>", methods=["PUT"])
def update_attendance(attendance_id):
    body = request.get_json(force=True) or {}
    conn = get_connection()
    try:
        cursor = conn.cursor()
        try:
            result = apply_update_attendance(
                cursor, attendance_id, body.get("attendance"), body.get("status", "Active"),
                actor_from_body(body),
            )
        except ValueError as exc:
            cursor.close()
            return jsonify({"error": str(exc)}), 404
        conn.commit()
        cursor.close()
        return jsonify(result)
    finally:
        conn.close()


@attendance_bp.route("/api/attendance/<int:attendance_id>", methods=["DELETE"])
def delete_attendance(attendance_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        apply_delete_attendance(cursor, attendance_id)
        conn.commit()
        cursor.close()
        return jsonify({"ok": True})
    finally:
        conn.close()
