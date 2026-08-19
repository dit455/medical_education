"""Auto-generates a username + one-time password for a newly created
Institution account. The password is only ever returned once, in the
create-institution response - it's stored as a hash after that."""

import random
import re
import string


def slugify_username(name):
    slug = re.sub(r"[^a-z0-9]+", "", (name or "").lower())
    return (slug or "inst")[:14]


def institution_initials(name):
    """First letter of each significant word, uppercase, e.g.
    'Savitha College' -> 'SC'. Falls back to the first 2 letters."""
    words = re.findall(r"[A-Za-z]+", name or "")
    initials = "".join(w[0] for w in words if w).upper()
    return (initials or "IN")[:4]


def generate_username(name, suffix):
    return f"{slugify_username(name)}{suffix}"


def generate_role_username(role, name, institution_id):
    """e.g. Creator_SC22, Approver_SC22 - role prefix + institution
    initials + institution id, unique and human-readable."""
    return f"{role}_{institution_initials(name)}{institution_id}"


def generate_password(length=10):
    alphabet = string.ascii_uppercase + string.ascii_lowercase + string.digits
    # Guarantee at least one of each character class for a usable password.
    pw = [
        random.choice(string.ascii_uppercase),
        random.choice(string.ascii_lowercase),
        random.choice(string.digits),
    ]
    pw += [random.choice(alphabet) for _ in range(length - len(pw))]
    random.shuffle(pw)
    return "".join(pw)