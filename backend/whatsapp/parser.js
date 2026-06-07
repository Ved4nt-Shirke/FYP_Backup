/**
 * parser.js
 * Parses and validates incoming WhatsApp messages for attendance marking.
 *
 * Expected format:
 *   ATT | ciannId | YYYY-MM-DD | Topic Name
 *   P: 1,3,5,7
 *   A: 2,4,6,8
 */

/**
 * Parse a raw WhatsApp message body into structured attendance data.
 * @param {string} body - Raw message text from WhatsApp
 * @returns {{ valid: boolean, error?: string, data?: object }}
 */
function parseAttendanceMessage(body) {
  if (!body || typeof body !== "string") {
    return { valid: false, error: "Empty message received." };
  }

  const lines = body
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 1) {
    return { valid: false, error: "Empty message." };
  }

  // --- Line 1: Header ---
  const headerLine = lines[0];
  if (!headerLine.toUpperCase().startsWith("ATT")) {
    return {
      valid: false,
      error:
        "❓ Wrong format.\nUse:\nATT | ciannId | YYYY-MM-DD | Topic\nP: 1,3,5\nA: 2,4,6",
    };
  }

  const parts = headerLine.split("|").map((p) => p.trim());
  if (parts.length < 4) {
    return {
      valid: false,
      error:
        "❓ Wrong format. Need 4 parts:\nATT | ciannId | YYYY-MM-DD | Topic\nP: 1,3,5\nA: 2,4,6",
    };
  }

  const ciannId = parseInt(parts[1]);
  if (isNaN(ciannId) || ciannId < 1000 || ciannId > 9999) {
    return {
      valid: false,
      error: `❌ Invalid CIANN ID "${parts[1]}". Must be a 4-digit number.`,
    };
  }

  const dateStr = parts[2];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return {
      valid: false,
      error: `❌ Invalid date "${dateStr}". Use format YYYY-MM-DD (e.g. 2026-03-04).`,
    };
  }

  const attendanceDate = new Date(dateStr);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (attendanceDate > today) {
    return {
      valid: false,
      error: `❌ Cannot mark attendance for a future date (${dateStr}).`,
    };
  }

  const topic = parts.slice(3).join("|").trim();
  if (!topic) {
    return { valid: false, error: "❌ Topic name is required in the header." };
  }

  // --- Lines 2+: Present and Absent roll numbers ---
  let presentRolls = [];
  let absentRolls = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();

    if (upperLine.startsWith("P:")) {
      const rollsStr = line.substring(2).trim();
      presentRolls = parseRollNumbers(rollsStr);
    } else if (upperLine.startsWith("A:")) {
      const rollsStr = line.substring(2).trim();
      absentRolls = parseRollNumbers(rollsStr);
    }
  }

  if (presentRolls.length === 0 && absentRolls.length === 0) {
    return {
      valid: false,
      error:
        "❌ No roll numbers found.\nAdd P: 1,3,5 for present and A: 2,4 for absent.",
    };
  }

  // Check for overlap
  const overlap = presentRolls.filter((r) => absentRolls.includes(r));
  if (overlap.length > 0) {
    return {
      valid: false,
      error: `❌ Roll numbers ${overlap.join(", ")} appear in both P and A lists.`,
    };
  }

  return {
    valid: true,
    data: {
      ciannId,
      date: dateStr,
      topic,
      presentRolls,
      absentRolls,
    },
  };
}

/**
 * Parse a comma-separated string of roll numbers into sorted integers.
 * @param {string} str - e.g. "1,3,5,7"
 * @returns {number[]}
 */
function parseRollNumbers(str) {
  if (!str) return [];
  return str
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n) && n > 0)
    .sort((a, b) => a - b);
}

module.exports = { parseAttendanceMessage };
