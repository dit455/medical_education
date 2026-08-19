"""Student Registration (tbl_student_det + tbl_student_enrol) and Internal
Marks Management (tbl_exam_schedule + tbl_student_marks, Internal Assessment
only) for the Institution Portal. Both flows are dispatched through the
existing tbl_pending_changes approval queue - see backend/routes/approvals.py,
which imports apply_create_student_registration and apply_create_internal_marks
from here.
"""

from flask import Blueprint, jsonify, request

from db import get_connection
from utils import actor_from_body
from credentials import institution_initials

student_reg_bp = Blueprint("student_reg", __name__)

INTERNAL_ASSESSMENT_EXAM_TYPE_ID = 1  # tbl_exam_type_master: 1 = Internal Assessment


def _student_row_to_dict(row):
    (student_id, reg_no, name, dob, father, address, email, mobile,
     region_id, status_, course_id, year_id, inst_id) = row
    return {
        "id": student_id,
        "registerNo": reg_no,
        "name": name,
        "dob": str(dob) if dob else None,
        "fatherName": father,
        "address": address,
        "email": email,
        "mobile": mobile,
        "regionId": region_id,
        "status": status_,
        "courseId": course_id,
        "yearId": year_id,
        "institutionId": inst_id,
    }


STUDENT_SELECT_SQL = """
    SELECT d.student_id, d.student_reg_no, d.student_name, d.student_dob,
           d.student_father_name, d.student_address, d.student_email,
           d.student_mobile, d.region_id, d.status_,
           e.course_id, e.year_id, e.inst_id
    FROM tbl_student_det d
    JOIN tbl_student_enrol e ON e.student_id = d.student_id
"""


def _generate_register_no(cursor, institution_id):
    """<INSTITUTION_INITIALS><4-digit sequence>, sequence counts this
    institution's existing enrolments, so numbers stay unique per institute
    and don't collide with other institutions using the same scheme."""
    cursor.execute("SELECT inst_name FROM tbl_inst_master WHERE inst_id = %s", (institution_id,))
    row = cursor.fetchone()
    inst_name = row[0] if row else "Institution"
    prefix = institution_initials(inst_name)

    cursor.execute("SELECT COUNT(*) FROM tbl_student_enrol WHERE inst_id = %s", (institution_id,))
    count = cursor.fetchone()[0]
    return f"{prefix}{str(count + 1).zfill(4)}"


def apply_create_student_registration(cursor, institution_id, payload, actor="system"):
    """Step 1 (tbl_student_det) + Step 2 (tbl_student_enrol), inserted
    together so a registration is never left half-created. The Register No
    is generated here automatically, per institution - the Creator never
    types one."""
    reg_no = _generate_register_no(cursor, institution_id)

    cursor.execute(
        """
        INSERT INTO tbl_student_det
            (student_reg_no, student_name, student_dob, student_father_name,
             student_address, student_email, student_mobile, region_id,
             created_by, created_date, status_)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), 'Active')
        """,
        (
            reg_no, payload.get("studentName"), payload.get("studentDob"),
            payload.get("studentFatherName"), payload.get("studentAddress"),
            payload.get("studentEmail"), payload.get("studentMobile"), payload.get("regionId"),
            actor,
        ),
    )
    student_id = cursor.lastrowid

    cursor.execute(
        """
        INSERT INTO tbl_student_enrol
            (student_id, inst_id, course_id, year_id, student_reg_no,
             created_by, created_date, status_)
        VALUES (%s, %s, %s, %s, %s, %s, NOW(), 'Active')
        """,
        (student_id, institution_id, payload.get("courseId"), payload.get("yearId"),
         reg_no, actor),
    )

    cursor.execute(STUDENT_SELECT_SQL + " WHERE d.student_id = %s", (student_id,))
    return _student_row_to_dict(cursor.fetchone())


def _find_or_create_exam_schedule(cursor, payload, actor):
    """Reuses an existing schedule row for this exact
    course/subject/year/sem/session/category/date combination, or creates
    one - so repeated marks entry for the same exam doesn't spawn duplicate
    schedule rows."""
    cursor.execute(
        """
        SELECT exam_sch_id FROM tbl_exam_schedule
        WHERE course_id = %s AND subject_id = %s AND year_id = %s AND sem_id = %s
          AND exam_session_id <=> %s AND exam_cat_id <=> %s AND exam_date <=> %s
        """,
        (
            payload.get("courseId"), payload.get("subjectId"), payload.get("yearId"),
            payload.get("semId"), payload.get("examSessionId"), payload.get("examCatId"),
            payload.get("examDate"),
        ),
    )
    existing = cursor.fetchone()
    if existing:
        return existing[0]

    cursor.execute(
        """
        INSERT INTO tbl_exam_schedule
            (course_id, subject_id, year_id, sem_id, exam_date, exam_session_id,
             exam_cat_id, created_by, created_date, status_)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), 'Active')
        """,
        (
            payload.get("courseId"), payload.get("subjectId"), payload.get("yearId"),
            payload.get("semId"), payload.get("examDate"), payload.get("examSessionId"),
            payload.get("examCatId"), actor,
        ),
    )
    return cursor.lastrowid


def apply_create_internal_marks(cursor, payload, actor="system"):
    """Ensures the exam schedule exists for this course/subject/year/sem/
    session/category/date, then records the student's Internal Assessment
    marks against it. exam_type_id is always forced to Internal regardless
    of what the caller sends, so External/Theory can never be written
    through this path."""
    _find_or_create_exam_schedule(cursor, payload, actor)

    cursor.execute(
        """
        INSERT INTO tbl_student_marks
            (student_id, subject_id, exam_type_id, exam_cat_id, marks_obtain,
             total_marks, exam_date, created_by, created_date, status_)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), 'Active')
        """,
        (
            payload.get("studentId"), payload.get("subjectId"),
            INTERNAL_ASSESSMENT_EXAM_TYPE_ID, payload.get("examCatId"),
            payload.get("scoredMarks"), payload.get("totalMarks"),
            payload.get("examDate"), actor,
        ),
    )
    mark_id = cursor.lastrowid
    cursor.execute(
        "SELECT student_marks_id, student_id, subject_id, exam_type_id, marks_obtain, "
        "total_marks, exam_date, status_ FROM tbl_student_marks WHERE student_marks_id = %s",
        (mark_id,),
    )
    row = cursor.fetchone()
    return {
        "id": row[0], "studentId": row[1], "subjectId": row[2], "examTypeId": row[3],
        "marksObtain": float(row[4]) if row[4] is not None else None,
        "totalMarks": float(row[5]) if row[5] is not None else None,
        "examDate": str(row[6]) if row[6] else None, "status": row[7],
    }


@student_reg_bp.route("/api/institutions/<int:institution_id>/students", methods=["GET"])
def get_students_for_institution(institution_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(STUDENT_SELECT_SQL + " WHERE e.inst_id = %s", (institution_id,))
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_student_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@student_reg_bp.route("/api/exam-categories", methods=["GET"])
def get_exam_categories():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT exam_cat_id, exam_cat_desc FROM tbl_exam_category_master WHERE status_ = 1 ORDER BY exam_cat_id"
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([{"id": r[0], "name": r[1]} for r in rows])
    finally:
        conn.close()


@student_reg_bp.route("/api/exam-sessions", methods=["GET"])
def get_exam_sessions():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT exam_session_id, exam_session_desc FROM tbl_exam_session_master WHERE status_ = 1 ORDER BY exam_session_id"
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([{"id": r[0], "name": r[1]} for r in rows])
    finally:
        conn.close()


@student_reg_bp.route("/api/institutions/<int:institution_id>/students", methods=["POST"])
def create_student_direct(institution_id):
    """Student Registration is created directly here - it does NOT go
    through the approval queue. Only Internal Marks entries require
    Approver review. The student becomes immediately selectable in
    Internal Marks Management once this commits."""
    body = request.get_json(force=True) or {}
    actor = actor_from_body(body)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        result = apply_create_student_registration(cursor, institution_id, body, actor)
        conn.commit()
        cursor.close()
        return jsonify(result), 201
    except Exception as exc:
        conn.rollback()
        return jsonify({"error": f"Could not register this student: {exc}"}), 400
    finally:
        conn.close()


def apply_update_student_registration(cursor, student_id, payload, actor="system"):
    """Updates tbl_student_det + tbl_student_enrol for a direct (non-approval)
    edit of a registered student. Mirrors apply_create_student_registration's
    payload shape."""
    cursor.execute(
        """
        UPDATE tbl_student_det
        SET student_reg_no = %s, student_name = %s, student_dob = %s,
            student_father_name = %s, student_address = %s, student_email = %s,
            student_mobile = %s, region_id = %s, updated_by = %s, updated_date = NOW()
        WHERE student_id = %s
        """,
        (
            payload.get("studentRegNo"), payload.get("studentName"), payload.get("studentDob"),
            payload.get("studentFatherName"), payload.get("studentAddress"),
            payload.get("studentEmail"), payload.get("studentMobile"), payload.get("regionId"),
            actor, student_id,
        ),
    )
    cursor.execute(
        """
        UPDATE tbl_student_enrol
        SET course_id = %s, year_id = %s, student_reg_no = %s,
            updated_by = %s, updated_date = NOW()
        WHERE student_id = %s
        """,
        (payload.get("courseId"), payload.get("yearId"), payload.get("studentRegNo"), actor, student_id),
    )
    cursor.execute(STUDENT_SELECT_SQL + " WHERE d.student_id = %s", (student_id,))
    row = cursor.fetchone()
    if row is None:
        raise ValueError("student not found")
    return _student_row_to_dict(row)


@student_reg_bp.route("/api/students/<int:student_id>", methods=["PUT"])
def update_student_direct(student_id):
    """Direct edit of a registered student - no approval queue involved."""
    body = request.get_json(force=True) or {}
    actor = actor_from_body(body)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        result = apply_update_student_registration(cursor, student_id, body, actor)
        conn.commit()
        cursor.close()
        return jsonify(result)
    except ValueError as exc:
        conn.rollback()
        return jsonify({"error": str(exc)}), 404
    except Exception as exc:
        conn.rollback()
        return jsonify({"error": f"Could not update this student: {exc}"}), 400
    finally:
        conn.close()


@student_reg_bp.route("/api/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    """Cascades: marks -> enrolment -> student record."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tbl_student_marks WHERE student_id = %s", (student_id,))
        cursor.execute("DELETE FROM tbl_student_enrol WHERE student_id = %s", (student_id,))
        cursor.execute("DELETE FROM tbl_student_det WHERE student_id = %s", (student_id,))
        conn.commit()
        cursor.close()
        return jsonify({"ok": True})
    finally:
        conn.close()