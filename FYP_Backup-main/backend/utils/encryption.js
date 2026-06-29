const crypto = require('crypto');
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Get the encryption key from environment variable.
 * Falls back to a default key (for development only).
 */
function getKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        console.warn('WARNING: ENCRYPTION_KEY not set in .env — using a default key. Set ENCRYPTION_KEY (64 hex chars) for production!');
        // Default dev-only key (32 bytes = 64 hex chars)
        return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
    }
    return Buffer.from(key, 'hex');
}

/**
 * Encrypt a plaintext string.
 * @param {string} text - The plaintext to encrypt.
 * @returns {string} The encrypted string in format "iv:encryptedData" (hex encoded).
 */
function encrypt(text) {
    if (!text) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an encrypted string.
 * @param {string} encryptedText - The encrypted string in format "iv:encryptedData".
 * @returns {string} The decrypted plaintext.
 */
function decrypt(encryptedText) {
    if (!encryptedText) return '';
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return '';
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * Mask an Aadhaar number for safe display.
 * E.g., "123456781234" → "XXXX-XXXX-1234"
 * @param {string} aadhaarNo - The full (decrypted) Aadhaar number.
 * @returns {string} Masked Aadhaar string.
 */
function maskAadhaar(aadhaarNo) {
    if (!aadhaarNo) return '';
    const cleaned = aadhaarNo.toString().replace(/\D/g, '');
    if (cleaned.length < 4) return 'XXXX-XXXX-XXXX';
    const lastFour = cleaned.slice(-4);
    return `XXXX-XXXX-${lastFour}`;
}

/**
 * Validate an Aadhaar number (must be exactly 12 digits).
 * @param {string} aadhaarNo - The Aadhaar number to validate.
 * @returns {boolean} True if valid.
 */
function validateAadhaar(aadhaarNo) {
    if (!aadhaarNo) return false;
    const cleaned = aadhaarNo.toString().replace(/[\s-]/g, '');
    return /^\d{12}$/.test(cleaned);
}

/**
 * Clean an Aadhaar number (remove spaces, dashes) to get pure 12 digits.
 * @param {string} aadhaarNo - The raw Aadhaar input.
 * @returns {string} Cleaned 12-digit string.
 */
function cleanAadhaar(aadhaarNo) {
    if (!aadhaarNo) return '';
    return aadhaarNo.toString().replace(/[\s-]/g, '');
}

module.exports = { encrypt, decrypt, maskAadhaar, validateAadhaar, cleanAadhaar };
