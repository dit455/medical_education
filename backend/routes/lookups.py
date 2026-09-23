"""Read-only lookup tables (regions, years, exam sems, course/subject masters)."""

from flask import Blueprint, jsonify, request

from db import get_connection
from utils import status_to_label

lookups_bp = Blueprint("lookups", __name__)


@lookups_bp.route("/api/regions", methods=["GET"])
def get_regions():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT region_id, region_desc FROM tbl_region_master WHERE status_ = 1"
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([{"id": r[0], "name": r[1]} for r in rows])
    finally:
        conn.close()


@lookups_bp.route("/api/categories", methods=["GET"])
def get_categories():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT cat_id, cat_desc FROM tbl_category_master WHERE status_ = 1"
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([{"id": r[0], "name": r[1]} for r in rows])
    finally:
        conn.close()


@lookups_bp.route("/api/years", methods=["GET"])
def get_years():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT year_id, year_desc FROM tbl_year_master WHERE status_ = 1")
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([{"id": r[0], "name": r[1]} for r in rows])
    finally:
        conn.close()


@lookups_bp.route("/api/exam-sems", methods=["GET"])
def get_exam_sems():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT sem_id, sem_desc FROM tbl_exam_sem_master WHERE status_ = 1"
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([{"id": r[0], "name": r[1]} for r in rows])
    finally:
        conn.close()


@lookups_bp.route("/api/courses", methods=["GET"])
def get_courses():
    # Dropdowns/pickers elsewhere want Active-only (the default). The Course
    # Master admin screen passes include_inactive=1 so it can show every
    # course, Inactive ones included, with their real status.
    include_inactive = request.args.get("include_inactive") == "1"
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT course_id, course_desc, course_abbr, status_ FROM tbl_course_master"
        if not include_inactive:
            query += " WHERE status_ = 1"
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([
            {"id": r[0], "name": r[1], "abbreviation": r[2], "status": status_to_label(r[3])}
            for r in rows
        ])
    finally:
        conn.close()


@lookups_bp.route("/api/subjects", methods=["GET"])
def get_all_subjects():
    # Same include_inactive convention as /api/courses above.
    include_inactive = request.args.get("include_inactive") == "1"
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT subject_id, subject_desc, status_ FROM tbl_subject_master"
        if not include_inactive:
            query += " WHERE status_ = 1"
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        return jsonify([
            {"id": r[0], "name": r[1], "status": status_to_label(r[2])}
            for r in rows
        ])
    finally:
        conn.close()
