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
    duration = row[3] if len(row) > 3 else None
    course_id, course_desc, status_ = row[0], row[1], row[2]
    return {"id": course_id, "name": course_desc, "status": status_to_label(status_), "duration": duration}


def apply_create_course(cursor, institution_id, name, status_label="Active", actor="system", allow_existing=True, duration=None, abbreviation=None):
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

    # Duplicate check is scoped to THIS institution only: block if this
    # institution already has an active course with the same name.
    if not allow_existing:
        cursor.execute(
            """
            SELECT m.course_id
            FROM tbl_inst_course_map m
            JOIN tbl_course_master c ON c.course_id = m.course_id
            WHERE m.inst_id = %s
              AND m.status_ = 1
              AND LOWER(TRIM(c.course_desc)) = LOWER(TRIM(%s))
            LIMIT 1
            """,
            (institution_id, name),
        )
        if cursor.fetchone():
            raise ValueError("A course with this name already exists.")

    # Reuse the existing master row if one with this name already exists
    # (case-insensitive) instead of inserting a duplicate master course.
    cursor.execute(
        "SELECT course_id FROM tbl_course_master WHERE LOWER(TRIM(course_desc)) = LOWER(TRIM(%s))",
        (name,),
    )
    existing = cursor.fetchone()

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
                (course_id, course_desc, course_abbr, {column}, {other_column},
                 created_by, created_date, status_)
            VALUES (%s, %s, %s, 1, 0, %s, NOW(), %s)
            """,
            (course_id, name, abbreviation, actor, status_),
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
                (inst_course_id, inst_id, course_id, duration, created_by, created_date, status_)
            VALUES (%s, %s, %s, %s, %s, NOW(), 1)
            """,
            (new_map_id, institution_id, course_id, duration, actor),
        )

        cursor.execute(
        "SELECT course_id, course_desc, status_ FROM tbl_course_master WHERE course_id = %s",
        (course_id,),
    )
    return _course_row_to_dict(cursor.fetchone())


def apply_create_master_course(cursor, name, status_label="Active", actor="system", abbreviation=None):
    """Create a course in tbl_course_master only, with NO institution mapping."""
    if not name or not name.strip():
        raise ValueError("Course name is required.")
    name = name.strip()
    status_ = label_to_status(status_label)

    cursor.execute(
        "SELECT course_id FROM tbl_course_master WHERE LOWER(TRIM(course_desc)) = LOWER(TRIM(%s))",
        (name,),
    )
    if cursor.fetchone() is not None:
        raise ValueError("A course with this name already exists.")

    cursor.execute("SELECT COALESCE(MAX(course_id), 0) + 1 FROM tbl_course_master")
    course_id = cursor.fetchone()[0]
    cursor.execute(
        """
        INSERT INTO tbl_course_master
            (course_id, course_desc, course_abbr, bome_status, boen_status,
             created_by, created_date, status_)
        VALUES (%s, %s, %s, 0, 0, %s, NOW(), %s)
        """,
        (course_id, name, abbreviation, actor, status_),
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
            SELECT c.course_id, c.course_desc, c.status_, m.duration
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


@courses_bp.route("/api/institutions/<int:institution_id>/category-courses", methods=["GET"])
def get_courses_by_institution_category(institution_id):
    """Every active course whose category matches this institution's own
    category - used by the Institution Portal so Creators automatically see
    all courses for their institution's category, no manual mapping needed."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT cat_id FROM tbl_inst_master WHERE inst_id = %s", (institution_id,))
        row = cursor.fetchone()
        if row is None or row[0] is None:
            cursor.close()
            return jsonify([])
        cat_id = row[0]
        cursor.execute(
            """
            SELECT course_id, course_desc, status_
            FROM tbl_course_master
            WHERE cat_id = %s AND status_ = 1
            ORDER BY course_desc
            """,
            (cat_id,),
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
                allow_existing=bool(body.get("allowExisting", True)),
                duration=body.get("duration"),
                abbreviation=body.get("abbreviation"),
            )
        except ValueError as exc:
            cursor.close()
            status = 409 if "already exists" in str(exc) else 404
            return jsonify({"error": str(exc)}), status
        conn.commit()
        cursor.close()
        return jsonify(result), 201
    finally:
        conn.close()




@courses_bp.route("/api/courses", methods=["POST"])
def create_master_course():
    body = request.get_json(force=True) or {}
    conn = get_connection()
    try:
        cursor = conn.cursor(buffered=True)
        try:
            result = apply_create_master_course(
                cursor, body.get("name"),
                body.get("status", "Active"), actor_from_body(body),
                abbreviation=body.get("abbreviation"),
            )
        except ValueError as exc:
            cursor.close()
            status = 409 if "already exists" in str(exc) else 400
            return jsonify({"error": str(exc)}), status
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



@courses_bp.route("/api/courses/<int:course_id>/status", methods=["PUT"])
def update_course_status(course_id):
    body = request.get_json(force=True) or {}
    status_ = label_to_status(body.get("status", "Active"))
    actor = actor_from_body(body)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tbl_course_master SET status_ = %s, updated_by = %s, updated_date = NOW() WHERE course_id = %s",
            (status_, actor, course_id),
        )
        conn.commit()
        cursor.close()
        return jsonify({"id": course_id, "status": status_to_label(status_)})
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
