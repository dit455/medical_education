// Small shared helpers used across pages/components.
import { BOARD_ROLES } from "./data.js";

// Groups an array of objects by the given field name, e.g. groupByField(routes, "group").
export function groupByField(items, field) {
  return items.reduce((groups, item) => {
    const key = item[field] || "Other";
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

// "uploadedOn" -> "Uploaded On" (fallback label for keys not present in FIELD_LABELS)
export function humanizeKey(key) {
  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase());
}

// Builds a blank row object from a field-definition list, defaulting select fields
// to their first option and text fields to "". Options may be plain strings or
// { value, label } objects (DB-backed dropdowns) - default to the plain value either way.
export function emptyRowFromFields(fields) {
  return fields.reduce((row, [key, , options]) => {
    if (!options) {
      row[key] = "";
    } else {
      const first = options[0];
      row[key] = typeof first === "object" && first !== null ? first.value : first;
    }
    return row;
  }, {});
}

// Ensures a row always has a status, defaulting to "Active".
export function withDefaultStatus(row) {
  return { ...row, status: row.status || "Active" };
}

// Generates a random 5-character captcha code.
export function randomCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Given scored marks and the pass-marks threshold configured on the subject
// (by the Department, at Add Subject), returns "Pass"/"Fail", or null when
// either value is missing/not yet known.
export function passOrFail(scoredMarks, passMarks) {
  if (scoredMarks === "" || scoredMarks === null || scoredMarks === undefined) return null;
  if (passMarks === "" || passMarks === null || passMarks === undefined) return null;
  return Number(scoredMarks) >= Number(passMarks) ? "Pass" : "Fail";
}

// Formats a date for display as "DD/MM/YYYY". Accepts a date-only string
// ("YYYY-MM-DD"), a full ISO timestamp ("YYYY-MM-DDTHH:mm:ss..."), or anything
// else the Date constructor can parse. Non-date values (empty, "-", already
// unparsable) are returned unchanged so callers don't need to special-case them.
export function formatDate(value) {
  if (value === null || value === undefined || value === "") return value;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

// Field keys that hold a date value (by naming convention: "date"/"dob"
// exactly, or a camelCase key ending in "Date"/"Dob", e.g. examDate,
// effectiveDate, requestedDate, studentDob). Used to auto-format date
// columns/fields in generic, field-driven components like DataTable and
// RecordModal.
export function isDateField(key) {
  return /^date$|^dob$|(Date|Dob)$/i.test(key);
}

// Converts a "DD/MM/YYYY" display string back to "YYYY-MM-DD" for storage.
// Returns the value unchanged if it isn't in that display format (e.g. it's
// already ISO, or empty) so it's always safe to call before saving.
export function parseDisplayDate(value) {
  if (!value) return value;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value).trim());
  if (!match) return value;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// Role-based permission checks used to gate the Verify/Approve row actions in DataTable.
export function canVerify(role) {
  return ["Board Verifier", "BOME", "BOEN", "Super Admin"].includes(role);
}

export function canApprove(role) {
  return ["Board Approver", "BOME", "BOEN", "Super Admin"].includes(role);
}

// Determines whether a workflow item's status should be visible for the given role
// (used to filter the Dashboard's workflow task queue).
export function isStatusVisibleForRole(status, role) {
  if (role === "Board Verifier") return ["Submitted", "Sent Back"].includes(status);
  if (role === "Board Approver") return ["Verified", "Submitted"].includes(status);
  if (BOARD_ROLES.includes(role)) {
    return ["Submitted", "Verified", "Sent Back"].includes(status);
  }
  return true;
}