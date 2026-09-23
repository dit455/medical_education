"""CRUD for tbl_inst_master (the Institutions table on the board dashboard)."""

from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash

from db import get_connection
from utils import actor_from_body, board_column, label_to_status, status_to_label
from credentials import generate_role_username, generate_password
from mailer import send_credentials_email
import threading

institutions_bp = Blueprint("institutions", __name__)

INSTITUTION_SELECT_SQL = """
    SELECT i.inst_id, i.inst_name, i.inst_abbr, i.status_, r.region_desc, c.cat_desc
    FROM tbl_inst_master i
    LEFT JOIN tbl_region_master r ON r.region_id = i.region_id
    LEFT JOIN tbl_category_master c ON c.cat_id = i.cat_id
"""


def _institution_row_to_dict(row):
    inst_id, inst_name, inst_abbr, status_, region_desc, cat_desc = row
    return {
        "id": inst_id,
        "name": inst_name,
        "abbreviation": inst_abbr,
        "region": region_desc,
        "category": cat_desc,
        "status": status_to_label(status_),
    }


@institutions_bp.route("/api/institutions", methods=["GET"])
def get_institutions():
    board = request.args.get("board")

    conn = get_connection()
    try:
        cursor = conn.cursor()
        if board:
            column = board_column(board)
            cursor.execute(INSTITUTION_SELECT_SQL + f" WHERE i.{column} > 0")
        else:
            # No board filter - every institution on either board, for admin
            # screens (e.g. picking an institution when creating an
            # Institution-login account) that aren't board-scoped.
            cursor.execute(INSTITUTION_SELECT_SQL + " WHERE i.bome_status > 0 OR i.boen_status > 0")
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_institution_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@institutions_bp.route("/api/institutions/<int:institution_id>", methods=["GET"])
def get_institution(institution_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(INSTITUTION_SELECT_SQL + " WHERE i.inst_id = %s", (institution_id,))
        row = cursor.fetchone()
        cursor.close()
        if row is None:
            return jsonify({"error": "institution not found"}), 404
        return jsonify(_institution_row_to_dict(row))
    finally:
        conn.close()


@institutions_bp.route("/api/institutions", methods=["POST"])
def create_institution():
    body = request.get_json(force=True) or {}
    name = body.get("name")
    inst_email = body.get("email")
    abbreviation = body.get("abbreviation")
    region_id = body.get("region_id")
    cat_id = body.get("category_id")
    board = body.get("board")
    status_label = body.get("status", "Active")
    column = board_column(board)
    status_ = label_to_status(status_label)
    actor = actor_from_body(body)

    conn = get_connection()
    try:
        cursor = conn.cursor()

        # Email must be globally unique.
        cursor.execute(
            "SELECT inst_id FROM tbl_inst_master WHERE UPPER(TRIM(inst_email)) = UPPER(TRIM(%s)) LIMIT 1",
            (inst_email or "",),
        )
        if cursor.fetchone():
            cursor.close()
            return jsonify({"error": "An institution with this email already exists."}), 409

        # Name must be unique unless region OR category differs.
        cursor.execute(
            """
            SELECT inst_id FROM tbl_inst_master
            WHERE UPPER(TRIM(inst_name)) = UPPER(TRIM(%s))
              AND region_id = %s AND cat_id = %s
            LIMIT 1
            """,
            (name or "", region_id, cat_id),
        )
        if cursor.fetchone():
            cursor.close()
            return jsonify({"error": "An institution with the same name, region and category already exists."}), 409

        cursor.execute("SELECT COALESCE(MAX(inst_id), 0) + 1 FROM tbl_inst_master")
        new_id = cursor.fetchone()[0]

        other_column = "boen_status" if column == "bome_status" else "bome_status"
        cursor.execute(
            f"""
            INSERT INTO tbl_inst_master
            (inst_id, inst_name, inst_email, inst_abbr, {column}, {other_column}, region_id, cat_id,
            created_by, created_date, status_)
            VALUES (%s, %s, %s, %s, 1, 0, %s, %s, %s, NOW(), %s)
            """,
            (new_id, name, inst_email, abbreviation, region_id, cat_id, actor, status_),
        )
        conn.commit()

        # Auto-provision two separate logins for this institution - one
        # permanently bound to Creator, one to Approver. Each plaintext
        # password is returned exactly once in this response; after this,
        # only its hash exists in the DB.
        creator_username = generate_role_username("Creator", name, new_id)
        creator_password = f"{creator_username}@123"
        approver_username = generate_role_username("Approver", name, new_id)
        approver_password = f"{approver_username}@123"

        cursor.execute(
            """
            INSERT INTO users (username, password, created_by, role, inst_id, must_change_password, institution_role)
            VALUES (%s, %s, %s, 'Institution', %s, 1, 'Creator')
            """,
            (creator_username, generate_password_hash(creator_password), actor, new_id),
        )
        cursor.execute(
            """
            INSERT INTO users (username, password, created_by, role, inst_id, must_change_password, institution_role)
            VALUES (%s, %s, %s, 'Institution', %s, 1, 'Approver')
            """,
            (approver_username, generate_password_hash(approver_password), actor, new_id),
        )
        conn.commit()

        cursor.execute(INSTITUTION_SELECT_SQL + " WHERE i.inst_id = %s", (new_id,))
        row = cursor.fetchone()
        cursor.close()
        result = _institution_row_to_dict(row)
        result["creatorLogin"] = {"username": creator_username, "password": creator_password}
        result["approverLogin"] = {"username": approver_username, "password": approver_password}
        # Send the credentials email in the background so the response
        # (and the credentials popup) returns immediately.
        threading.Thread(
            target=send_credentials_email,
            args=(
                inst_email, name,
                {"username": creator_username, "password": creator_password},
                {"username": approver_username, "password": approver_password},
            ),
            daemon=True,
        ).start()
        return jsonify(result), 201
    finally:
        conn.close()


@institutions_bp.route("/api/institutions/<int:institution_id>", methods=["PUT"])
def update_institution(institution_id):
    body = request.get_json(force=True) or {}
    name = body.get("name")
    abbreviation = body.get("abbreviation")
    region_id = body.get("region_id")
    cat_id = body.get("category_id")
    status_ = label_to_status(body.get("status", "Active"))
    actor = actor_from_body(body)

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE tbl_inst_master
            SET inst_name = %s, inst_abbr = %s, region_id = %s, cat_id = %s, status_ = %s,
                updated_by = %s, updated_date = NOW()
            WHERE inst_id = %s
            """,
            (name, abbreviation, region_id, cat_id, status_, actor, institution_id),
        )
        conn.commit()

        cursor.execute(INSTITUTION_SELECT_SQL + " WHERE i.inst_id = %s", (institution_id,))
        row = cursor.fetchone()
        cursor.close()
        return jsonify(_institution_row_to_dict(row))
    finally:
        conn.close()


@institutions_bp.route("/api/institutions/<int:institution_id>/status", methods=["PUT"])
def update_institution_status(institution_id):
    body = request.get_json(force=True) or {}
    status_ = label_to_status(body.get("status", "Active"))
    actor = actor_from_body(body)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tbl_inst_master SET status_ = %s, updated_by = %s, updated_date = NOW() WHERE inst_id = %s",
            (status_, actor, institution_id),
        )
        conn.commit()
        cursor.close()
        return jsonify({"id": institution_id, "status": status_to_label(status_)})
    finally:
        conn.close()


@institutions_bp.route("/api/institutions/<int:institution_id>", methods=["DELETE"])
def delete_institution(institution_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()

        # Collect this institution's students so their dependent rows can be
        # removed first (foreign keys block deleting the institution otherwise).
        cursor.execute(
            "SELECT student_id FROM tbl_student_enrol WHERE inst_id = %s", (institution_id,)
        )
        student_ids = [r[0] for r in cursor.fetchall()]

        if student_ids:
            fmt = ",".join(["%s"] * len(student_ids))
            # Marks / internal marks tied to these students (ignore if tables absent).
            for tbl in ("tbl_attendance", "tbl_student_marks", "tbl_student_master"):
                try:
                    cursor.execute(
                        f"DELETE FROM {tbl} WHERE student_id IN ({fmt})", tuple(student_ids)
                    )
                except Exception:
                    pass
            cursor.execute(
                f"DELETE FROM tbl_student_enrol WHERE student_id IN ({fmt})", tuple(student_ids)
            )
            cursor.execute(
                f"DELETE FROM tbl_student_det WHERE student_id IN ({fmt})", tuple(student_ids)
            )

        # Any remaining enrolment rows for this institution.
        cursor.execute(
            "DELETE FROM tbl_student_enrol WHERE inst_id = %s", (institution_id,)
        )
        # tbl_student_master references inst_id directly.
        cursor.execute(
            "DELETE FROM tbl_student_master WHERE inst_id = %s", (institution_id,)
        )
        # Auto-provisioned login account(s).
        cursor.execute(
            "DELETE FROM users WHERE inst_id = %s", (institution_id,)
        )
        cursor.execute(
            "DELETE FROM tbl_inst_course_map WHERE inst_id = %s", (institution_id,)
        )
        cursor.execute(
            "DELETE FROM tbl_inst_master WHERE inst_id = %s", (institution_id,)
        )
        conn.commit()
        cursor.close()
        return jsonify({"ok": True})
    except Exception as exc:
        conn.rollback()
        return jsonify({"error": f"Could not delete this institution: {exc}"}), 400
    finally:
        conn.close()
