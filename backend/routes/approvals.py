"""Generic pending-changes approval queue.

An Institution-login account doesn't write to the live tables directly -
it submits a proposed create/update/delete as a row in tbl_pending_changes
(see DB Files/institution_workflow.sql). A Department Admin reviews each
one and either:
  - approves it: the payload is applied to the real table via the same
    apply_* functions the direct CRUD routes use, then the row is marked
    Approved, or
  - rejects it: the row is marked Rejected and nothing is ever applied.

Not wired into the active frontend yet - this is the backend foundation for
the future Institution login.
"""

import json

from flask import Blueprint, jsonify, request

from db import get_connection
from utils import actor_from_body
from routes.courses import apply_create_course, apply_update_course, apply_delete_course
from routes.subjects import apply_create_subject, apply_update_subject, apply_delete_subject
from routes.students import apply_create_student, apply_update_student, apply_delete_student
from routes.marks import apply_create_marks, apply_update_marks, apply_delete_marks
from routes.attendance import apply_create_attendance, apply_update_attendance, apply_delete_attendance

approvals_bp = Blueprint("approvals", __name__)

ENTITY_TYPES = {"course", "subject", "student", "student_marks", "attendance"}
ACTIONS = {"create", "update", "delete"}


def _change_row_to_dict(row):
    (change_id, entity_type, action, entity_id, institution_id, payload_json, status_,
     requested_by, requested_date, reviewed_by, reviewed_date, review_note) = row
    return {
        "id": change_id,
        "entityType": entity_type,
        "action": action,
        "entityId": entity_id,
        "institutionId": institution_id,
        "payload": json.loads(payload_json) if payload_json else {},
        "status": status_,
        "requestedBy": requested_by,
        "requestedDate": requested_date.isoformat() if requested_date else None,
        "reviewedBy": reviewed_by,
        "reviewedDate": reviewed_date.isoformat() if reviewed_date else None,
        "reviewNote": review_note,
    }


CHANGE_SELECT_SQL = """
    SELECT change_id, entity_type, action, entity_id, institution_id, payload_json,
           status_, requested_by, requested_date, reviewed_by, reviewed_date, review_note
    FROM tbl_pending_changes
"""


def _apply_change(cursor, entity_type, action, entity_id, institution_id, payload, actor):
    """Dispatches an approved change to the matching apply_* function. Raises
    ValueError on anything invalid (unknown entity_type/action, missing
    entity_id for update/delete, or the underlying apply_* rejecting it)."""

    if entity_type == "course":
        if action == "create":
            return apply_create_course(cursor, institution_id, payload.get("name"),
                                        payload.get("status", "Active"), actor)
        if action == "update":
            return apply_update_course(cursor, entity_id, payload.get("name"),
                                        payload.get("status", "Active"), actor)
        if action == "delete":
            return apply_delete_course(cursor, institution_id, entity_id)

    if entity_type == "subject":
        if action == "create":
            return apply_create_subject(cursor, payload.get("courseId"), payload.get("subject"),
                                         payload.get("yearId"), payload.get("semId"),
                                         payload.get("priority"), payload.get("status", "Active"), actor)
        if action == "update":
            return apply_update_subject(cursor, entity_id, payload.get("subject"),
                                         payload.get("yearId"), payload.get("semId"),
                                         payload.get("priority"), payload.get("status", "Active"), actor)
        if action == "delete":
            return apply_delete_subject(cursor, entity_id)

    if entity_type == "student":
        if action == "create":
            return apply_create_student(cursor, institution_id, payload.get("courseId"), payload.get("name"),
                                         payload.get("registerNo"), payload.get("term"),
                                         payload.get("status", "Active"), actor)
        if action == "update":
            return apply_update_student(cursor, entity_id, payload.get("name"), payload.get("registerNo"),
                                         payload.get("term"), payload.get("status", "Active"), actor)
        if action == "delete":
            return apply_delete_student(cursor, entity_id)

    if entity_type == "student_marks":
        if action == "create":
            return apply_create_marks(cursor, payload.get("studentId"), payload.get("subjectId"),
                                       payload.get("internal"), payload.get("exam"), payload.get("result"),
                                       payload.get("status", "Active"), actor)
        if action == "update":
            return apply_update_marks(cursor, entity_id, payload.get("internal"), payload.get("exam"),
                                       payload.get("result"), payload.get("status", "Active"), actor)
        if action == "delete":
            return apply_delete_marks(cursor, entity_id)

    if entity_type == "attendance":
        if action == "create":
            return apply_create_attendance(cursor, payload.get("studentId"), payload.get("subjectId"),
                                            payload.get("examType"), payload.get("attendance"),
                                            payload.get("status", "Active"), actor)
        if action == "update":
            return apply_update_attendance(cursor, entity_id, payload.get("attendance"),
                                            payload.get("status", "Active"), actor)
        if action == "delete":
            return apply_delete_attendance(cursor, entity_id)

    raise ValueError(f"unsupported entity_type/action: {entity_type}/{action}")


@approvals_bp.route("/api/pending-changes", methods=["GET"])
def list_pending_changes():
    institution_id = request.args.get("institution_id")
    status_ = request.args.get("status")

    clauses, params = [], []
    if institution_id:
        clauses.append("institution_id = %s")
        params.append(institution_id)
    if status_:
        clauses.append("status_ = %s")
        params.append(status_)
    where = f" WHERE {' AND '.join(clauses)}" if clauses else ""

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(CHANGE_SELECT_SQL + where + " ORDER BY requested_date DESC", params)
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_change_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@approvals_bp.route("/api/pending-changes", methods=["POST"])
def create_pending_change():
    body = request.get_json(force=True) or {}
    entity_type = body.get("entityType")
    action = body.get("action")
    institution_id = body.get("institutionId")

    if entity_type not in ENTITY_TYPES:
        return jsonify({"error": f"entityType must be one of {sorted(ENTITY_TYPES)}"}), 400
    if action not in ACTIONS:
        return jsonify({"error": f"action must be one of {sorted(ACTIONS)}"}), 400
    if not institution_id:
        return jsonify({"error": "institutionId is required"}), 400
    if action in ("update", "delete") and not body.get("entityId"):
        return jsonify({"error": "entityId is required for update/delete"}), 400

    actor = actor_from_body(body)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO tbl_pending_changes
                (entity_type, action, entity_id, institution_id, payload_json,
                 status_, requested_by, requested_date)
            VALUES (%s, %s, %s, %s, %s, 'Pending', %s, NOW())
            """,
            (entity_type, action, body.get("entityId"), institution_id,
             json.dumps(body.get("payload") or {}), actor),
        )
        conn.commit()
        change_id = cursor.lastrowid
        cursor.execute(CHANGE_SELECT_SQL + " WHERE change_id = %s", (change_id,))
        row = cursor.fetchone()
        cursor.close()
        return jsonify(_change_row_to_dict(row)), 201
    finally:
        conn.close()


@approvals_bp.route("/api/pending-changes/<int:change_id>/approve", methods=["POST"])
def approve_pending_change(change_id):
    body = request.get_json(force=True) or {}
    actor = actor_from_body(body)

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(CHANGE_SELECT_SQL + " WHERE change_id = %s", (change_id,))
        row = cursor.fetchone()
        if row is None:
            cursor.close()
            return jsonify({"error": "pending change not found"}), 404

        change = _change_row_to_dict(row)
        if change["status"] != "Pending":
            cursor.close()
            return jsonify({"error": f"change is already {change['status']}"}), 409

        try:
            applied = _apply_change(cursor, change["entityType"], change["action"], change["entityId"],
                                     change["institutionId"], change["payload"], actor)
        except ValueError as exc:
            conn.rollback()
            cursor.close()
            return jsonify({"error": str(exc)}), 400

        # For "create", the row didn't have a real entity_id yet - record the
        # one the apply_* function just created so later updates/deletes on
        # this same pending-change record (and anyone reading it back) know
        # what it actually became.
        new_entity_id = applied.get("id") if change["action"] == "create" and applied else change["entityId"]

        cursor.execute(
            """
            UPDATE tbl_pending_changes
            SET status_ = 'Approved', entity_id = %s, reviewed_by = %s, reviewed_date = NOW()
            WHERE change_id = %s
            """,
            (new_entity_id, actor, change_id),
        )
        conn.commit()

        cursor.execute(CHANGE_SELECT_SQL + " WHERE change_id = %s", (change_id,))
        result = _change_row_to_dict(cursor.fetchone())
        result["appliedResult"] = applied
        cursor.close()
        return jsonify(result)
    finally:
        conn.close()


@approvals_bp.route("/api/pending-changes/<int:change_id>/reject", methods=["POST"])
def reject_pending_change(change_id):
    body = request.get_json(force=True) or {}
    actor = actor_from_body(body)
    note = (body.get("note") or "").strip() or None

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT status_ FROM tbl_pending_changes WHERE change_id = %s", (change_id,))
        row = cursor.fetchone()
        if row is None:
            cursor.close()
            return jsonify({"error": "pending change not found"}), 404
        if row[0] != "Pending":
            cursor.close()
            return jsonify({"error": f"change is already {row[0]}"}), 409

        cursor.execute(
            """
            UPDATE tbl_pending_changes
            SET status_ = 'Rejected', reviewed_by = %s, reviewed_date = NOW(), review_note = %s
            WHERE change_id = %s
            """,
            (actor, note, change_id),
        )
        conn.commit()

        cursor.execute(CHANGE_SELECT_SQL + " WHERE change_id = %s", (change_id,))
        result = _change_row_to_dict(cursor.fetchone())
        cursor.close()
        return jsonify(result)
    finally:
        conn.close()
