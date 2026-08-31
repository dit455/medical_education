"""Sends credential emails via the organization's SMTP server.
Reads SMTP_* from the environment (.env). If SMTP isn't configured,
send_credentials_email() returns False instead of raising, so
institution creation never fails just because mail is down."""

import os
import smtplib
from email.message import EmailMessage


def _smtp_config():
    return {
        "host": os.environ.get("SMTP_HOST"),
        "port": int(os.environ.get("SMTP_PORT", "587")),
        "user": os.environ.get("SMTP_USER"),
        "password": os.environ.get("SMTP_PASSWORD"),
        "sender": os.environ.get("SMTP_FROM", os.environ.get("SMTP_USER", "")),
        "use_tls": os.environ.get("SMTP_USE_TLS", "1") == "1",
    }


def send_credentials_email(to_email, institution_name, creator, approver):
    """creator/approver are dicts: {'username':..., 'password':...}.
    Returns True on success, False if not configured or on failure."""
    cfg = _smtp_config()
    if not cfg["host"] or not to_email:
        return False

    msg = EmailMessage()
    msg["Subject"] = f"EMS login credentials — {institution_name}"
    msg["From"] = cfg["sender"]
    msg["To"] = to_email
    msg.set_content(
        f"""Dear {institution_name},

Your institution has been registered on the EMS portal.
Two logins have been created. You must change the password on first login.

CREATOR LOGIN
  Username: {creator['username']}
  Password: {creator['password']}

APPROVER LOGIN
  Username: {approver['username']}
  Password: {approver['password']}

Please keep these credentials secure and do not share them.

Regards,
BOME & BOEN — EMS
Medical Education Board, Government of Puducherry
"""
    )

    try:
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=20) as server:
            if cfg["use_tls"]:
                server.starttls()
            if cfg["user"]:
                server.login(cfg["user"], cfg["password"])
            server.send_message(msg)
        return True
    except Exception as exc:
        print(f"[mailer] Failed to send credentials email: {exc}")
        return False