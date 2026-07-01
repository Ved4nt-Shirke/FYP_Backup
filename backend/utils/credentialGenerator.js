const bcrypt = require('bcryptjs');

/**
 * Generate username from student name
 * Format: firstName(4 letters).lastName(4 letters) - all lowercase
 * @param {string} studentName - Full name of the student
 * @returns {string} Generated username
 */
const generateUsername = (studentName) => {
  if (!studentName || typeof studentName !== 'string') {
    throw new Error('Invalid student name');
  }

  const parts = studentName.trim().split(/\s+/);
  
  if (parts.length === 0) {
    throw new Error('Student name cannot be empty');
  }

  let firstName = parts[0].toLowerCase();
  let lastName = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';

  // Take first 4 letters, or full name if less than 4
  const firstPart = firstName.substring(0, 4);
  const lastPart = lastName.substring(0, 4);

  if (!lastName) {
    return firstPart; // Only first name available
  }

  return `${firstPart}.${lastPart}`;
};

/**
 * Generate a random 4-digit number
 * @returns {number} Random number between 1000-9999
 */
const generateRandomNumber = () => {
  return Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
};

/**
 * Generate password from username
 * Format: username + random 4-digit number
 * @param {string} username - Generated username
 * @returns {string} Generated password (plain text)
 */
const generatePassword = (username) => {
  const randomNum = generateRandomNumber();
  return `${username}${randomNum}`;
};

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare plain text password with hashed password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generate complete credentials for a student
 * @param {string} studentName - Full name of the student
 * @param {Array<string>} existingUsernames - List of already generated usernames
 * @returns {Promise<{username: string, password: string, hashedPassword: string}>}
 */
const generateCredentials = async (studentName, existingUsernames = []) => {
  let username = generateUsername(studentName);
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure username is unique by appending a number if needed
  while (existingUsernames.includes(username) && attempts < maxAttempts) {
    attempts++;
    const num = generateRandomNumber();
    const baseParts = username.split('.');
    if (baseParts.length === 2) {
      username = `${baseParts[0]}.${baseParts[1]}${num}`;
    } else {
      username = `${username}${num}`;
    }
  }

  if (attempts >= maxAttempts) {
    throw new Error(`Could not generate unique username for ${studentName} after ${maxAttempts} attempts`);
  }

  const plainPassword = generatePassword(username);
  const hashedPassword = await hashPassword(plainPassword);

  return {
    username,
    password: plainPassword, // Return plain text for display once
    hashedPassword, // Store this in database
  };
};

module.exports = {
  generateUsername,
  generatePassword,
  generateRandomNumber,
  hashPassword,
  comparePassword,
  generateCredentials,
};
