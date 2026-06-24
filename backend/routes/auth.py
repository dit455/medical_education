"""Login, department-admin, and Institution-account management.

Institution accounts (role='Institution', tied to one tbl_inst_master row via
users.inst_id) aren't surfaced in the frontend login flow yet - they're built
so that part can be turned on later without further backend work.
"""

import os

import mysql.connector
from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from db import get_connection
from utils import actor_from_body

auth_bp = Blueprint("auth", __name__)


def ensure_super_admin():
    """Creates the Super Admin account in the `users` table if it doesn't
    exist yet. Username/password come from env vars (SUPERADMIN_USERNAME /
    SUPERADMIN_PASSWORD) so the account lives in the DB instead of being
    hardcoded in the frontend - call this once at app startup.
    """
    username = os.environ.get("SUPERADMIN_USERNAME", "superadmin")
    password = os.environ.get("SUPERADMIN_PASSWORD", "Admin@123")

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE role = %s", ("Super Admin",))
        if cursor.fetchone() is not None:
            cursor.close()
            return
        cursor.execute(
            """
            INSERT INTO users (username, password, created_by, role)
            VALUES (%s, %s, %s, %s)
            """,
            (username, generate_password_hash(password), "system", "Super Admin"),
        )
        conn.commit()
        cursor.close()
    except mysql.connector.IntegrityError:
        pass
    finally:
        conn.close()


def _user_row_to_dict(row):
    return {
        "id": row[0],
        "username": row[1],
        "department": row[2],
        "role": row[3],
        "institutionId": row[4] if len(row) > 4 else None,
    }


@auth_bp.route("/api/login", methods=["POST"])
def login():
    body = request.get_json(force=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, username, department, role, inst_id, password FROM users WHERE username = %s",
            (username,),
        )
        row = cursor.fetchone()
        cursor.close()
        if row is None or not row[5] or not check_password_hash(row[5], password):
            return jsonify({"error": "Invalid username or password"}), 401
        return jsonify(_user_row_to_dict(row[:5]))
    finally:
        conn.close()


@auth_bp.route("/api/users", methods=["GET"])
def list_department_admins():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, username, department, role FROM users WHERE role = %s ORDER BY id",
            ("department-admin",),
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_user_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@auth_bp.route("/api/users", methods=["POST"])
def create_department_admin():
    body = request.get_json(force=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    department = body.get("department") or ""
    actor = actor_from_body(body)
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (username, password, department, created_by, role)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (username, generate_password_hash(password), department, actor, "department-admin"),
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute(
            "SELECT id, username, department, role FROM users WHERE id = %s", (new_id,)
        )
        row = cursor.fetchone()
        cursor.close()
        return jsonify(_user_row_to_dict(row)), 201
    except mysql.connector.IntegrityError:
        return jsonify({"error": "Username already exists"}), 409
    finally:
        conn.close()


@auth_bp.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_department_admin(user_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = %s AND role = %s", (user_id, "department-admin"))
        conn.commit()
        cursor.close()
        return jsonify({"ok": True})
    finally:
        conn.close()


# --------------------------------------------------------------------------
# Institution-login accounts (role='Institution', tied to one inst_id).
# Mirrors the department-admin endpoints above. Not used by the frontend yet.
# --------------------------------------------------------------------------


@auth_bp.route("/api/institution-users", methods=["GET"])
def list_institution_users():
    institution_id = request.args.get("institution_id")
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if institution_id:
            cursor.execute(
                "SELECT id, username, department, role, inst_id FROM users WHERE role = %s AND inst_id = %s ORDER BY id",
                ("Institution", institution_id),
            )
        else:
            cursor.execute(
                "SELECT id, username, department, role, inst_id FROM users WHERE role = %s ORDER BY id",
                ("Institution",),
            )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([_user_row_to_dict(r) for r in rows])
    finally:
        conn.close()


@auth_bp.route("/api/institution-users", methods=["POST"])
def create_institution_user():
    body = request.get_json(force=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    institution_id = body.get("institutionId")
    actor = actor_from_body(body)
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    if not institution_id:
        return jsonify({"error": "institutionId is required"}), 400

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (username, password, created_by, role, inst_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (username, generate_password_hash(password), actor, "Institution", institution_id),
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute(
            "SELECT id, username, department, role, inst_id FROM users WHERE id = %s", (new_id,)
        )
        row = cursor.fetchone()
        cursor.close()
        return jsonify(_user_row_to_dict(row)), 201
    except mysql.connector.IntegrityError:
        return jsonify({"error": "Username already exists"}), 409
    finally:
        conn.close()


@auth_bp.route("/api/institution-users/<int:user_id>", methods=["DELETE"])
def delete_institution_user(user_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = %s AND role = %s", (user_id, "Institution"))
        conn.commit()
        cursor.close()
        return jsonify({"ok": True})
    finally:
        conn.close()
