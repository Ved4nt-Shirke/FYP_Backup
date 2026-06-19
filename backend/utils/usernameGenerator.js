const User = require("../models/user");
const Student = require("../models/Student");

/**
 * Generates a unique username for a student based on enrollment number and college/institution context.
 * If the enrollment number clean-up yields a username that already exists:
 * - If the existing user is a student in the SAME institution with the SAME enrollment number, we reuse it (compatibility/promoting).
 * - Otherwise (different student, different college, or non-student), we append numeric suffixes (_1, _2, etc.) until a unique username in the User collection is found.
 *
 * @param {string} enrollmentNo - Student enrollment number.
 * @param {string} institution - Institution/college code.
 * @returns {Promise<string>} A guaranteed unique username.
 */
async function generateUniqueUsername(enrollmentNo, institution) {
  if (!enrollmentNo) {
    throw new Error("Enrollment number is required to generate username");
  }
  
  // Base username is lowercase alphanumeric only
  const baseUsername = enrollmentNo.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  if (!baseUsername) {
    // Sane fallback if enrollmentNo has only special characters
    return generateFallbackUsername(institution);
  }

  let username = baseUsername;
  let counter = 1;

  while (true) {
    const existingUser = await User.findOne({ username });
    
    if (!existingUser) {
      // The username is completely available in the User database.
      return username;
    }

    // Username is taken. Check if we can reuse it:
    // It must belong to a student in the same institution, and there must be an existing Student record with the same enrollmentNo.
    if (existingUser.role === "student" && existingUser.college === institution) {
      const matchingStudent = await Student.findOne({
        institution,
        username,
        enrollmentNo
      });
      if (matchingStudent) {
        // Yes, it is the exact same student. Reuse the username.
        return username;
      }
    }

    // Otherwise, it is a conflict (taken by other user, other college, or non-student).
    // Append a counter suffix to resolve the conflict.
    username = `${baseUsername}_${counter}`;
    counter++;
  }
}

/**
 * Fallback generator when the enrollment number clean-up returns an empty string.
 */
async function generateFallbackUsername(institution) {
  const base = "std";
  while (true) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    const username = `${base}_${randomSuffix}`;
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return username;
    }
  }
}

module.exports = {
  generateUniqueUsername
};
