/**
 * Generate username from name (alphabets only)
 * Format: firstname.surname or firstname if no surname
 */
export const generateUsername = (fullName) => {
  if (!fullName || typeof fullName !== 'string') return '';
  
  // Remove all non-alphabetic characters except spaces
  const cleanName = fullName.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  
  if (!cleanName) return '';
  
  const nameParts = cleanName.split(/\s+/).filter(part => part.length > 0);
  
  if (nameParts.length === 0) return '';
  if (nameParts.length === 1) return nameParts[0];
  
  // firstname.surname format
  const firstName = nameParts[0];
  const surname = nameParts[nameParts.length - 1];
  
  return `${firstName}.${surname}`;
};

/**
 * Generate secure password with uppercase, lowercase, and numbers
 * Format: Xxxxx9999 (Capital letter + lowercase letters + numbers)
 */
export const generateSecurePassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  
  // Start with 1 uppercase letter
  let password = uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  
  // Add 4-5 lowercase letters
  const lowercaseCount = 4 + Math.floor(Math.random() * 2); // 4 or 5
  for (let i = 0; i < lowercaseCount; i++) {
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  }
  
  // Add 3-4 numbers
  const numberCount = 3 + Math.floor(Math.random() * 2); // 3 or 4
  for (let i = 0; i < numberCount; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return password;
};

/**
 * Validate username format (alphabets and dots only)
 */
export const validateUsername = (username) => {
  if (!username) return false;
  return /^[a-z]+(\.[a-z]+)?$/.test(username);
};

/**
 * Validate password format (must have uppercase, lowercase, and numbers)
 */
export const validatePassword = (password) => {
  if (!password || password.length < 8) return false;
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber;
};

/**
 * Generate credentials for faculty/staff
 */
export const generateCredentials = (fullName) => {
  return {
    username: generateUsername(fullName),
    password: generateSecurePassword()
  };
};
