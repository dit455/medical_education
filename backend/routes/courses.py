"""CRUD for tbl_course_master and tbl_inst_course_map (Courses table).

The apply_* functions take an open cursor and do the actual writes without
committing - they're the single source of truth for "what does creating/
editing/deleting a course mean", shared by the HTTP routes below and by the
pending-changes approval dispatcher (routes/approvals.py), which calls them
directly once a Department Admin approves an Institution's proposed change.
"""

from flask import Blueprint, jsonify, request

from db import get_connection
from utils import actor_from_body, label_to_status, status_to_label

courses_bp = Blueprint("courses", __name__)


def _course_row_to_dict(row):
    course_id, course_desc, status_ = row
    return {"id": course_id, "name": course_desc, "status": status_to_label(status_)}


def apply_create_course(cursor, institution_id, name, status_label="Active", actor="system"):
    name = (name or "").strip()
    status_ = label_to_status(status_label)

    cursor.execute(
        "SELECT bome_status, boen_status FROM tbl_inst_master WHERE inst_id = %s",
        (institution_id,),
    )
    inst_row = cursor.fetchone()
    if inst_row is None:
        raise ValueError("institution not found")
    bome_status, boen_status = inst_row
    column = "bome_status" if bome_status and bome_status > 0 else "boen_status"
    other_column = "boen_status" if column == "bome_status" else "bome_status"

    # Reuse the existing course master row if one with this name already
    # exists (case-insensitive) instead of inserting a duplicate - just map
    # the existing course to this institution.
    cursor.execute(
        "SELECT course_id FROM tbl_course_master WHERE LOWER(course_desc) = LOWER(%s)",
        (name,),
    )
    existing = cursor.fetchone()
    
    cursor.fetchall()
    

    if existing:
        course_id = existing[0]
        cursor.execute(
            f"UPDATE tbl_course_master SET {column} = 1 WHERE course_id = %s",
            (course_id,),
        )
    else:
        cursor.execute("SELECT COALESCE(MAX(course_id), 0) + 1 FROM tbl_course_master")
        course_id = cursor.fetchone()[0]
        cursor.execute(
            f"""
            INSERT INTO tbl_course_master
                (course_id, course_desc, {column}, {other_column},
                 created_by, created_date, status_)
            VALUES (%s, %s, 1, 0, %s, NOW(), %s)
            """,
            (course_id, name, actor, status_),
        )

    # Likewise, don't create a second mapping row if this course is already
    # mapped to the institution.
    cursor.execute(
        "SELECT inst_course_id FROM tbl_inst_course_map WHERE inst_id = %s AND course_id = %s",
        (institution_id, course_id),
    )
    if cursor.fetchone() is None:
        cursor.execute(
            "SELECT COALESCE(MAX(inst_course_id), 0) + 1 FROM tbl_inst_course_map"
        )
        new_map_id = cursor.fetchone()[0]
        cursor.execute(
            """
            INSERT INTO tbl_inst_course_map
                (inst_course_id, inst_id, course_id, created_by, created_date, status_)
            VALUES (%s, %s, %s, %s, NOW(), 1)
            """,
            (new_map_id, institution_id, course_id, actor),
        )

    cursor.execute(
        "SELECT course_id, course_desc, status_ FROM tbl_course_master WHERE course_id = %s",
        (course_id,),
    )
    return _course_row_to_dict(cursor.fetchone())


def apply_update_course(cursor, course_id, name, status_label="Active", actor="system"):
    status_ = label_to_status(status_label)
    cursor.execute(
        """
        UPDATE tbl_course_master
        SET course_desc = %s, status_ = %s, updated_by = %s, updated_date = NOW()
        WHERE course_id = %s
        """,
        (name, status_, actor, course_id),
    )
    cursor.execute(
        "SELECT course_id, course_desc, status_ FROM tbl_course_master WHERE course_id = %s",
        (course_id,),
    )
    return _course_row_to_dict(cursor.fetchone())


def apply_delete_course(cursor, institution_id, course_id):
    # Only removes this institution's mapping to the course - the course
    # master row (and its subjects) stays untouched since other institutions
    # may still be mapped to the same course.
    cursor.execute(
        "DELETE FROM tbl_inst_course_map WHERE inst_id = %s AND course_id = %s",
        (institution_id, course_id),
    )


@courses_bp.route("/api/institutions/<int:institution_id>/courses", methods=["GET"])
def get_courses_for_institution(institution_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT c.course_id, c.course_desc, c.status_
            FROM tbl_inst_course_map m
            JOIN tbl_course_master c ON c.course_id = m.course_id
            WHERE m.inst_id = %s
            """,
            (institution_id,),
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_course_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@courses_bp.route("/api/institutions/<int:institution_id>/courses", methods=["POST"])
def create_course_for_institution(institution_id):
    body = request.get_json(force=True) or {}
    conn = get_connection()
    try:
        cursor = conn.cursor(buffered=True)
        try:
            result = apply_create_course(
                cursor, institution_id, body.get("name"),
                body.get("status", "Active"), actor_from_body(body),
            )
        except ValueError as exc:
            cursor.close()
            return jsonify({"error": str(exc)}), 404
        conn.commit()
        cursor.close()
        return jsonify(result), 201
    finally:
        conn.close()


@courses_bp.route("/api/courses/<int:course_id>", methods=["PUT"])
def update_course(course_id):
    body = request.get_json(force=True) or {}
    conn = get_connection()
    try:
        cursor = conn.cursor()
        result = apply_update_course(
            cursor, course_id, body.get("name"), body.get("status", "Active"), actor_from_body(body),
        )
        conn.commit()
        cursor.close()
        return jsonify(result)
    finally:
        conn.close()


@courses_bp.route("/api/institutions/<int:institution_id>/courses/<int:course_id>", methods=["DELETE"])
def delete_course(institution_id, course_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        apply_delete_course(cursor, institution_id, course_id)
        conn.commit()
        cursor.close()
        return jsonify({"ok": True})
    finally:
        conn.close()
