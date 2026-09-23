"""CRUD for tbl_subject_master and tbl_course_subject_map (Subjects table).

The apply_* functions take an open cursor and do the actual writes without
committing - shared by the HTTP routes below and by the pending-changes
approval dispatcher (routes/approvals.py).
"""

from flask import Blueprint, jsonify, request

from werkzeug.security import check_password_hash

from db import get_connection
from utils import actor_from_body, label_to_status, status_to_label
from crypto_sign import generate_key_pair, sign_payload

subjects_bp = Blueprint("subjects", __name__)

def _verify_signing_password(cursor, username, password):
    """Re-authenticate the signing user before their key is used. Raises
    ValueError if the password is missing or wrong."""
    if not password:
        raise ValueError("password is required to sign marks")
    cursor.execute("SELECT password FROM users WHERE username = %s", (username,))
    row = cursor.fetchone()
    if row is None or not row[0] or not check_password_hash(row[0], password):
        raise ValueError("invalid password - signature rejected")

def _get_or_create_private_key(cursor, user_id):
    """Return the user's private key PEM, generating a key pair on first use."""
    cursor.execute(
        "SELECT private_key FROM tbl_user_keys WHERE user_id = %s", (user_id,)
    )
    row = cursor.fetchone()
    if row:
        return row[0]
    priv_pem, pub_pem = generate_key_pair()
    cursor.execute(
        """
        INSERT INTO tbl_user_keys (user_id, public_key, private_key, created_date)
        VALUES (%s, %s, %s, NOW())
        """,
        (user_id, pub_pem, priv_pem),
    )
    return priv_pem


def _sign_mark_change(cursor, actor, course_subject_id, exam_type_id, mx, ps, total_marks, signature_name):
    """Sign a canonical representation of the changed marks with the actor's key."""
    payload = f"{course_subject_id}|{exam_type_id}|{mx}|{ps}|{total_marks}|{signature_name}"
    priv_pem = _get_or_create_private_key(cursor, actor)
    signature = sign_payload(priv_pem, payload)
    return payload, signature

def _load_divisions(cursor, course_subject_id):
    cursor.execute(
        """
        SELECT sm.exam_type_id, t.exam_type_desc, sm.max_marks, sm.pass_marks,
               sm.total_marks, sm.effective_date
        FROM tbl_subject_marks sm
        JOIN tbl_exam_type_master t ON t.exam_type_id = sm.exam_type_id
        WHERE sm.course_subject_id = %s
        ORDER BY sm.id
        """,
        (course_subject_id,),
    )
    divisions = []
    total_max = 0
    total_pass = 0
    eff = None
    for etid, etype, mx, ps, total_marks, edate in cursor.fetchall():
        divisions.append({
            "examTypeId": etid,
            "type": etype,
            "maxMarks": mx,
            "passMarks": ps,
            "totalMarks": total_marks,
        })
        total_max += mx or 0
        total_pass += ps or 0
        if edate and not eff:
            eff = edate
    return divisions, total_max, total_pass, (str(eff) if eff else None)


def _subject_row_to_dict(row, cursor=None):
    (course_subject_id, subject_desc, year_desc, sem_desc, priority_id, status_) = row
    result = {
        "id": course_subject_id,
        "subject": subject_desc,
        "year": year_desc,
        "semester": sem_desc,
        "priority": priority_id,
        "status": status_to_label(status_),
        "divisions": [],
        "totalMax": None,
        "totalPass": None,
        "effectiveDate": None,
    }
    if cursor is not None:
        divisions, total_max, total_pass, eff = _load_divisions(cursor, course_subject_id)
        result["divisions"] = divisions
        result["totalMax"] = total_max
        result["totalPass"] = total_pass
        result["effectiveDate"] = eff
    return result


SUBJECT_SELECT_SQL = """
    SELECT m.course_subject_id, s.subject_desc, y.year_desc, e.sem_desc,
           m.priority_id, m.status_
    FROM tbl_course_subject_map m
    JOIN tbl_subject_master s ON s.subject_id = m.subject_id
    JOIN tbl_year_master y ON y.year_id = m.year_id
    JOIN tbl_exam_sem_master e ON e.sem_id = m.sem_id
"""

def apply_create_subject(cursor, course_id, subject, year_id, sem_id, priority=None,
                          status_label="Active", actor="system",
                          divisions=None, effective_date=None, total_marks=100,
                          course_subject_id=None, signature_name=None):
    subject = (subject or "").strip()
    # An empty effective date must become NULL, not '' — MySQL rejects '' for a DATE column.
    if not effective_date:
        effective_date = None
    status_ = label_to_status(status_label)

    if divisions:
        signature_name = (signature_name or "").strip().upper()
        if not signature_name:
            raise ValueError("digital signature name is required")
    # re-authenticate before their key signs anything.
    

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

    # When editing marks the caller passes the exact mapping row to reuse.
    # Otherwise fall back to matching course/subject/year/sem.
    if course_subject_id is not None:
        cursor.execute(
            "SELECT course_subject_id FROM tbl_course_subject_map WHERE course_subject_id = %s",
            (course_subject_id,),
        )
    else:
        cursor.execute(
            """
            SELECT course_subject_id FROM tbl_course_subject_map
            WHERE course_id = %s AND subject_id = %s AND year_id = %s AND sem_id = %s
            """,
            (course_id, subject_id, year_id, sem_id),
        )
    existing_map = cursor.fetchone()

    if existing_map and course_subject_id is None:
        raise ValueError("This subject is already added for the selected course, year and semester.")

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

    # Replace this subject's marks divisions with the supplied set.
    # Snapshot existing divisions (keyed by exam_type_id) so we can log whether
    # each incoming division is a first-time INSERT or an UPDATE to prior marks.
    cursor.execute(
        """
        SELECT exam_type_id, max_marks, pass_marks, total_marks
        FROM tbl_subject_marks WHERE course_subject_id = %s
        """,
        (map_id,),
    )
    prev = {row[0]: {"max": row[1], "pass": row[2], "total": row[3]} for row in cursor.fetchall()}

    # Replace this subject's marks divisions with the supplied set.
    cursor.execute(
        "DELETE FROM tbl_subject_marks WHERE course_subject_id = %s", (map_id,)
    )
    for d in (divisions or []):
        mx = int(d.get("maxMarks") or 0)
        ps = int(d.get("passMarks") or 0)
        if mx <= 0 and ps <= 0:
            continue  # skip blank divisions
        etid = d.get("examTypeId")
        cursor.execute(
            """
            INSERT INTO tbl_subject_marks
                (course_subject_id, exam_type_id, max_marks, pass_marks, total_marks, effective_date)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (map_id, etid, mx, ps, total_marks, effective_date),
        )

        # Write an audit-trail entry: UPDATE when this exam type had prior
        # marks, otherwise INSERT.
        old = prev.get(etid)
        if old is None:
            payload, signature = _sign_mark_change(
                cursor, actor, map_id, etid, mx, ps, total_marks, signature_name
            )
            cursor.execute(
                """
                INSERT INTO tbl_subject_marks_log
                    (course_subject_id, exam_type_id, new_max_marks, new_pass_marks,
                     new_total_marks, action_, changed_by, changed_date,
                     signed_by, signed_payload, signature_, signed_date, signature_name)
                VALUES (%s, %s, %s, %s, %s, 'INSERT', %s, NOW(),
                        %s, %s, %s, NOW(), %s)
                """,
                (map_id, etid, mx, ps, total_marks, actor,
                 actor, payload, signature, signature_name),
            )
        elif old["max"] != mx or old["pass"] != ps or old["total"] != total_marks:
            payload, signature = _sign_mark_change(
                cursor, actor, map_id, etid, mx, ps, total_marks, signature_name
            )
            cursor.execute(
                """
                INSERT INTO tbl_subject_marks_log
                    (course_subject_id, exam_type_id, old_max_marks, old_pass_marks,
                     old_total_marks, new_max_marks, new_pass_marks, new_total_marks,
                     action_, changed_by, changed_date,
                     signed_by, signed_payload, signature_, signed_date, signature_name)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'UPDATE', %s, NOW(),
                        %s, %s, %s, NOW(), %s)
                """,
                (map_id, etid, old["max"], old["pass"], old["total"],
                 mx, ps, total_marks, actor,
                 actor, payload, signature, signature_name),
            )

    cursor.execute(SUBJECT_SELECT_SQL + " WHERE m.course_subject_id = %s", (map_id,))
    return _subject_row_to_dict(cursor.fetchone(), cursor)


def apply_create_master_subject(cursor, subject, status_label="Active", actor="system"):
    """Create a subject in tbl_subject_master only, with NO course mapping."""
    subject = (subject or "").strip()
    if not subject:
        raise ValueError("Subject name is required.")
    status_ = label_to_status(status_label)

    cursor.execute(
        "SELECT subject_id FROM tbl_subject_master WHERE LOWER(TRIM(subject_desc)) = LOWER(TRIM(%s))",
        (subject,),
    )
    if cursor.fetchone() is not None:
        raise ValueError("A subject with this name already exists.")

    cursor.execute("SELECT COALESCE(MAX(subject_id), 0) + 1 FROM tbl_subject_master")
    subject_id = cursor.fetchone()[0]
    cursor.execute(
        """
        INSERT INTO tbl_subject_master
            (subject_id, subject_desc, bome_status, boen_status,
             created_by, created_date, status_)
        VALUES (%s, %s, 0, 0, %s, NOW(), %s)
        """,
        (subject_id, subject, actor, status_),
    )
    return {"id": subject_id, "name": subject, "status": status_to_label(status_)}


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
        result = [_subject_row_to_dict(r, cursor) for r in rows]
        cursor.close()
        return jsonify(result)
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
                body.get("divisions"), body.get("effective_date"),
                body.get("totalMarks", 100), body.get("course_subject_id"),
                body.get("signature_name"),
            )
        except ValueError as exc:
            cursor.close()
            status = 409 if "already added" in str(exc) else 404
            return jsonify({"error": str(exc)}), status
        conn.commit()
        cursor.close()
        return jsonify(result), 201
    finally:
        conn.close()


@subjects_bp.route("/api/subjects", methods=["POST"])
def create_master_subject():
    body = request.get_json(force=True) or {}
    conn = get_connection()
    try:
        cursor = conn.cursor(buffered=True)
        try:
            result = apply_create_master_subject(
                cursor, body.get("name") or body.get("subject"),
                body.get("status", "Active"), actor_from_body(body),
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


@subjects_bp.route("/api/subjects/<int:course_subject_id>", methods=["PUT"])
def update_subject(course_subject_id):
    body = request.get_json(force=True) or {}
    conn = get_connection()
    try:
        cursor = conn.cursor()
        try:
            if body.get("divisions"):
                result = apply_create_subject(
                    cursor, body.get("courseId"), body.get("subject"),
                    body.get("yearId") or body.get("year_id"), body.get("semId") or body.get("sem_id"),
                    body.get("priority"), body.get("status", "Active"), actor_from_body(body),
                    body.get("divisions"), body.get("effectiveDate"),
                    body.get("totalMarks", 100), course_subject_id,
                    body.get("signatureName"),
                )
            else:
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


@subjects_bp.route("/api/subject-master/<int:subject_id>/status", methods=["PUT"])
def update_master_subject_status(subject_id):
    body = request.get_json(force=True) or {}
    status_ = label_to_status(body.get("status", "Active"))
    actor = actor_from_body(body)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tbl_subject_master SET status_ = %s, updated_by = %s, updated_date = NOW() WHERE subject_id = %s",
            (status_, actor, subject_id),
        )
        # Cascade to every course mapping so Academic Mapping shows the same status.
        cursor.execute(
            "UPDATE tbl_course_subject_map SET status_ = %s, updated_by = %s, updated_date = NOW() WHERE subject_id = %s",
            (status_, actor, subject_id),
        )
        conn.commit()
        cursor.close()
        return jsonify({"id": subject_id, "status": status_to_label(status_)})
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


@subjects_bp.route("/api/marks-log/<int:log_id>/verify", methods=["GET"])
def verify_mark_signature(log_id):
    from crypto_sign import verify_payload
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT l.signed_payload, l.signature_, k.public_key
            FROM tbl_subject_marks_log l
            JOIN tbl_user_keys k ON k.user_id = l.signed_by
            WHERE l.log_id = %s
            """,
            (log_id,),
        )
        row = cursor.fetchone()
        cursor.close()
        if not row or not row[0]:
            return jsonify({"verified": False, "reason": "no signature on this entry"}), 404
        payload, signature, public_key = row
        ok = verify_payload(public_key, payload, signature)
        return jsonify({"log_id": log_id, "verified": ok})
    finally:
        conn.close()
