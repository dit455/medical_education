import re, shutil, pathlib

FILES = ["src/styles.css", "src/styles/home.css", "src/styles/ux4g-widget.css", "src/styles/cookie-consent.css"]

TOKENS = """/* ===== DBIM TYPE SCALE (Sec. 4.3) - change sizes only here ===== */
:root {
  --fs-h1: 36px; --fs-h2: 24px; --fs-h3: 20px; --fs-p: 16px; --fs-sm: 12px;
}
@media (max-width: 767px) {
  :root { --fs-h1: 24px; --fs-h2: 20px; --fs-h3: 16px; --fs-p: 14px; --fs-sm: 12px; }
}
body { font-size: var(--fs-p); }
h1 { font-size: var(--fs-h1); }
h2 { font-size: var(--fs-h2); }
h3, h4, h5, h6 { font-size: var(--fs-h3); }
p, li, td, th, label, input, select, textarea, button { font-size: var(--fs-p); }
small { font-size: var(--fs-sm); }
/* ===== END DBIM TYPE SCALE ===== */

"""

def to_px(tok):
    m = re.fullmatch(r"(\d*\.?\d+)(px|rem)", tok)
    if not m: return None
    v = float(m.group(1))
    return v * 16 if m.group(2) == "rem" else v

def bucket(val):
    if "var(" in val: return None
    toks = re.findall(r"\d*\.?\d+(?:px|rem)", val)
    nums = [to_px(t) for t in toks]
    nums = [n for n in nums if n is not None]
    if not nums: return None
    v = max(nums)
    if v >= 30: return "h1"
    if v >= 22: return "h2"
    if v >= 18: return "h3"
    if v > 12.2: return "p"
    return "sm"

FORCE_P = ["pub-footer-links", "pub-footer-policies", "pub-footer-brand span", "pub-footer-meta",
           "pub-service-more", "pub-quicklinks", "pub-brand-contact", "pub-brand-dept", "pub-utility",
           "pub-card-text small", "pub-stat-note", "pub-stat-label", "pub-search-results small",
           "pub-news-month", "pub-hero-trust", "pub-gov-chip", "pub-field-error", "app-footer"]
cur_sel, pending = "", ""

def fix(line):
    global cur_sel, pending
    if "{" in line:
        cur_sel = pending + line.split("{")[0]; pending = ""
    elif ";" in line or "}" in line: pending = ""
    elif line.strip().endswith(","): pending += line
    m = re.search(r"font-size\s*:\s*([^;}]+)", line)
    if not m: return line
    b = bucket(m.group(1))
    if not b: return line
    if b == "sm" and any(k in cur_sel for k in FORCE_P): b = "p"
    imp = " !important" if "!important" in m.group(1) else ""
    new = f"font-size: var(--fs-{b}){imp}"
    return line[:m.start()] + new + line[m.end():]

for f in FILES:
    p = pathlib.Path(f)
    if not p.exists():
        print("skip", f); continue
    bak = pathlib.Path(str(p) + ".bak")
    if not bak.exists(): shutil.copy(p, bak)
    txt = bak.read_bytes().decode("utf-8")
    out = "".join(fix(l) for l in txt.splitlines(keepends=True))
    if f == "src/styles.css": out = TOKENS + out
    p.write_bytes(out.encode("utf-8"))
    print("done", f)