"""Flask API entrypoint backing the Institutions / Courses / Subjects hierarchy
on the BOME / BOEN board dashboard, plus login and department-admin management.

Routes live in routes/<section>.py (lookups, institutions, courses, subjects,
students, marks, attendance, approvals, auth) as Flask Blueprints - add new
endpoints there, or create a new module and register its blueprint below as
the API grows.

students/marks/attendance/approvals are backend-only for now (no Institution
login UI wired up yet) - see DB Files/institution_workflow.sql for context.
"""

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

load_dotenv()

from routes.approvals import approvals_bp
from routes.attendance import attendance_bp
from routes.auth import auth_bp, ensure_super_admin
from routes.courses import courses_bp
from routes.institutions import institutions_bp
from routes.lookups import lookups_bp
from routes.marks import marks_bp
from routes.students import students_bp
from routes.subjects import subjects_bp

app = Flask(__name__)
# Vite picks a different port if 5173 is busy, and may be reached via the
# machine's LAN IP instead of localhost - allow any localhost/127.0.0.1/private
# LAN address on any port for local dev, rather than hardcoding one origin.
# CORS(app, origins=[
#     r"^http://localhost(:\d+)?$",
#     r"^http://127\.0\.0\.1(:\d+)?$",
#     r"^http://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$",
# ])
CORS(app)

app.register_blueprint(lookups_bp)
app.register_blueprint(institutions_bp)
app.register_blueprint(courses_bp)
app.register_blueprint(subjects_bp)
app.register_blueprint(students_bp)
app.register_blueprint(marks_bp)
app.register_blueprint(attendance_bp)
app.register_blueprint(approvals_bp)
app.register_blueprint(auth_bp)

ensure_super_admin()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
