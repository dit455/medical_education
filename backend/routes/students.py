"""CRUD for tbl_student_master, scoped to one institution + course.

Not wired into the active frontend yet - this exists so the pending-changes
approval flow (routes/approvals.py) has a real table to apply Institution-
submitted student changes to, once that login is turned on.
"""

from flask import Blueprint, jsonify, request

from db import get_connection
from utils import actor_from_body

students_bp = Blueprint("students", __name__)


def _student_row_to_dict(row):
    student_id, student_name, register_no, inst_id, course_id, term, status_ = row
    return {
        "id": student_id,
        "name": student_name,
        "registerNo": register_no,
        "institutionId": inst_id,
        "courseId": course_id,
        "term": term,
        "status": status_,
    }


STUDENT_SELECT_SQL = """
    SELECT student_id, student_name, register_no, inst_id, course_id, term, status_
    FROM tbl_student_master
"""


def apply_create_student(cursor, institution_id, course_id, name, register_no=None,
                          term=None, status_label="Active", actor="system"):
    cursor.execute(
        """
        INSERT INTO tbl_student_master
            (student_name, register_no, inst_id, course_id, term,
             created_by, created_date, status_)
        VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
        """,
        ((name or "").strip(), register_no, institution_id, course_id, term, actor, status_label),
    )
    student_id = cursor.lastrowid
    cursor.execute(STUDENT_SELECT_SQL + " WHERE student_id = %s", (student_id,))
    return _student_row_to_dict(cursor.fetchone())


def apply_update_student(cursor, student_id, name=None, register_no=None, term=None,
                          status_label="Active", actor="system"):
    cursor.execute(
        """
        UPDATE tbl_student_master
        SET student_name = %s, register_no = %s, term = %s, status_ = %s,
            updated_by = %s, updated_date = NOW()
        WHERE student_id = %s
        """,
        (name, register_no, term, status_label, actor, student_id),
    )
    cursor.execute(STUDENT_SELECT_SQL + " WHERE student_id = %s", (student_id,))
    row = cursor.fetchone()
    if row is None:
        raise ValueError("student not found")
    return _student_row_to_dict(row)


def apply_delete_student(cursor, student_id):
    cursor.execute("DELETE FROM tbl_student_marks WHERE student_id = %s", (student_id,))
    cursor.execute("DELETE FROM tbl_attendance WHERE student_id = %s", (student_id,))
    cursor.execute("DELETE FROM tbl_student_master WHERE student_id = %s", (student_id,))


@students_bp.route("/api/institutions/<int:institution_id>/students", methods=["GET"])
def get_students_for_institution(institution_id):
    course_id = request.args.get("course_id")
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if course_id:
            cursor.execute(
                STUDENT_SELECT_SQL + " WHERE inst_id = %s AND course_id = %s",
                (institution_id, course_id),
            )
        else:
            cursor.execute(STUDENT_SELECT_SQL + " WHERE inst_id = %s", (institution_id,))
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_student_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@students_bp.route("/api/institutions/<int:institution_id>/students", methods=["POST"])
def create_student(institution_id):
    body = request.get_json(force=True) or {}
    conn = get_connection()
    try:
        cursor = conn.cursor()
        result = apply_create_student(
            cursor, institution_id, body.get("courseId"), body.get("name"),
            body.get("registerNo"), body.get("term"), body.get("status", "Active"),
            actor_from_body(body),
        )
        conn.commit()
        cursor.close()
        return jsonify(result), 201
    finally:
        conn.close()


@students_bp.route("/api/students/<int:student_id>", methods=["PUT"])
def update_student(student_id):
    body = request.get_json(force=True) or {}
    conn = get_connection()
    try:
        cursor = conn.cursor()
        try:
            result = apply_update_student(
                cursor, student_id, body.get("name"), body.get("registerNo"), body.get("term"),
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


@students_bp.route("/api/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        apply_delete_student(cursor, student_id)
        conn.commit()
        cursor.close()
        return jsonify({"ok": True})
    finally:
        conn.close()
