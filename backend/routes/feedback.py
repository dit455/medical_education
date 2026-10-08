"""Public feedback form (tbl_feedback) + server-side image captcha.

The captcha answer never reaches the browser as text: the server draws it
into a PNG and returns only the image plus a signed token. The answer is
checked here, so it cannot be copied, read from the page or skipped.
"""

import base64
import hashlib
import hmac
import io
import os
import random
import re
import secrets
import time

from flask import Blueprint, jsonify, request
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from db import get_connection

feedback_bp = Blueprint("feedback", __name__)

# Set CAPTCHA_SECRET in .env if you run more than one worker/process.
CAPTCHA_SECRET = (os.environ.get("CAPTCHA_SECRET") or secrets.token_hex(32)).encode()
CAPTCHA_TTL = 300                      # seconds a captcha stays valid
CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"   # no 0/O, 1/I
CAPTCHA_LEN = 5
_used_tokens = {}                      # token -> expiry (blocks re-use)

FEEDBACK_CATEGORIES = {"General", "Examinations", "Marks / Results", "Technical issue"}
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_recent = {}                           # ip -> [timestamps] (simple rate limit)
RATE_LIMIT, RATE_WINDOW = 5, 600       # 5 submissions per 10 minutes per IP


# ---------------------------------------------------------------- captcha
def _sign(answer, expires, nonce):
    msg = f"{answer}|{expires}|{nonce}".encode()
    return hmac.new(CAPTCHA_SECRET, msg, hashlib.sha256).hexdigest()


def _font(size):
    for name in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def _draw(text):
    w, h = 170, 56
    img = Image.new("RGB", (w, h), (236, 244, 244))
    draw = ImageDraw.Draw(img)
    for _ in range(6):   # background lines
        draw.line([(random.randint(0, w), random.randint(0, h)),
                   (random.randint(0, w), random.randint(0, h))],
                  fill=(random.randint(120, 190),) * 3, width=1)
    font = _font(26)
    x = 10
    for ch in text:      # each character rotated separately
        layer = Image.new("RGBA", (40, 50), (0, 0, 0, 0))
        ImageDraw.Draw(layer).text((6, 4), ch, font=font,
                                   fill=(15, random.randint(60, 100), 87, 255))
        layer = layer.rotate(random.randint(-25, 25), resample=Image.BICUBIC)
        img.paste(layer, (x, random.randint(3, 6)), layer)
        x += 30
    for _ in range(140):  # noise dots
        draw.point((random.randint(0, w - 1), random.randint(0, h - 1)),
                   fill=(random.randint(80, 200),) * 3)
    draw.line([(0, random.randint(15, 40)), (w, random.randint(15, 40))],
              fill=(15, 87, 87), width=2)  # strike line
    img = img.filter(ImageFilter.SMOOTH)
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def verify_captcha(token, answer):
    """True if `answer` matches the captcha behind `token`. One use only."""
    now = int(time.time())
    for t, exp in list(_used_tokens.items()):
        if exp < now:
            _used_tokens.pop(t, None)
    try:
        expires, nonce, sig = (token or "").split(".")
        expires = int(expires)
    except ValueError:
        return False
    if expires < now or token in _used_tokens:
        return False
    _used_tokens[token] = expires        # one attempt per captcha, right or wrong
    expected = _sign((answer or "").strip().upper(), expires, nonce)
    return hmac.compare_digest(expected, sig)


@feedback_bp.route("/api/captcha", methods=["GET"])
def new_captcha():
    text = "".join(random.choice(CAPTCHA_CHARS) for _ in range(CAPTCHA_LEN))
    expires = int(time.time()) + CAPTCHA_TTL
    nonce = secrets.token_hex(8)
    token = f"{expires}.{nonce}.{_sign(text, expires, nonce)}"
    resp = jsonify({"token": token, "image": _draw(text)})
    resp.headers["Cache-Control"] = "no-store"
    return resp


# ---------------------------------------------------------------- feedback
@feedback_bp.route("/api/feedback", methods=["POST"])
def submit_feedback():
    body = request.get_json(force=True) or {}

    ip = request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()
    now = time.time()
    hits = [t for t in _recent.get(ip, []) if now - t < RATE_WINDOW]
    if len(hits) >= RATE_LIMIT:
        return jsonify({"error": "Too many submissions. Please try again in a few minutes."}), 429

    if not verify_captcha(body.get("captchaToken"), body.get("captchaAnswer")):
        return jsonify({"error": "Captcha does not match. Please try the new one.", "field": "captcha"}), 400

    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    category = (body.get("category") or "").strip()
    message = (body.get("message") or "").strip()

    if not name or len(name) > 100:
        return jsonify({"error": "Enter your full name (max 100 characters).", "field": "name"}), 400
    if not EMAIL_RE.match(email) or len(email) > 150:
        return jsonify({"error": "Enter a valid email address.", "field": "email"}), 400
    if category not in FEEDBACK_CATEGORIES:
        return jsonify({"error": "Choose a category.", "field": "category"}), 400
    if not message or len(message) > 2000:
        return jsonify({"error": "Enter your message (max 2000 characters).", "field": "message"}), 400

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO tbl_feedback (name, email, category, message) VALUES (%s, %s, %s, %s)",
            (name, email, category, message),
        )
        new_id = cursor.lastrowid
        conn.commit()
        cursor.close()
    finally:
        conn.close()

    hits.append(now)
    _recent[ip] = hits
    return jsonify({"id": new_id, "reference": f"FB{new_id:06d}"}), 201


@feedback_bp.route("/api/feedback", methods=["GET"])
def list_feedback():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT feedback_id, name, email, category, message, status_, created_date, "
            "reviewed_by, reviewed_date FROM tbl_feedback ORDER BY feedback_id DESC"
        )
        rows = cursor.fetchall()
        cursor.close()
    finally:
        conn.close()
    return jsonify([
        {
            "id": r[0], "reference": f"FB{r[0]:06d}", "name": r[1], "email": r[2],
            "category": r[3], "message": r[4], "status": r[5],
            "createdDate": r[6].strftime("%d/%m/%Y %H:%M") if r[6] else None,
            "reviewedBy": r[7],
            "reviewedDate": r[8].strftime("%d/%m/%Y %H:%M") if r[8] else None,
        }
        for r in rows
    ])


@feedback_bp.route("/api/feedback/<int:feedback_id>/status", methods=["PUT"])
def set_feedback_status(feedback_id):
    body = request.get_json(force=True) or {}
    status = body.get("status")
    if status not in ("New", "Reviewed"):
        return jsonify({"error": "status must be New or Reviewed"}), 400
    actor = (body.get("actor") or "").strip() or "system"
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tbl_feedback SET status_ = %s, reviewed_by = %s, reviewed_date = NOW() "
            "WHERE feedback_id = %s",
            (status, actor if status == "Reviewed" else None, feedback_id),
        )
        conn.commit()
        cursor.close()
    finally:
        conn.close()
    return jsonify({"ok": True})