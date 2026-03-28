// Form data encryption/decryption (AES-256-CBC + HMAC)
import crypto from 'crypto';
import { config } from './config';

/**
 * Encrypt data for secure form transmission.
 * Format: base64(IV[16] + HMAC[32] + ciphertext)
 */
export function encryptData(input: any): string | false {
  try {
    // Match PHP: accept string, number, array/object and JSON encode it
    const plaintext = typeof input === 'string' ? input : JSON.stringify(input);

    // SHA256 hash the secret key to get a consistent 32-byte key
    const key = crypto.createHash('sha256').update(config.FORM_SECRET_KEY).digest();

    // Generate random 16-byte IV
    const iv = crypto.randomBytes(16);

    // AES-256-CBC encrypt
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // HMAC-SHA256 for integrity over the ciphertext
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(encrypted);
    const mac = hmac.digest();

    // Combine: IV + HMAC + ciphertext
    const combined = Buffer.concat([iv, mac, encrypted]);
    return combined.toString('base64');
  } catch {
    return false;
  }
}

/**
 * Decrypt data from secure form transmission.
 * Expects base64(IV[16] + HMAC[32] + ciphertext)
 */
export function decryptData(encryptedData: string): any | false {
  try {
    const combined = Buffer.from(encryptedData, 'base64');

    if (combined.length < 48) {
      return false; // Too short: need at least IV(16) + HMAC(32)
    }

    // SHA256 hash the secret key
    const key = crypto.createHash('sha256').update(config.FORM_SECRET_KEY).digest();

    // Separate components
    const iv = combined.subarray(0, 16);
    const mac = combined.subarray(16, 48);
    const ciphertext = combined.subarray(48);

    // Verify HMAC
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(ciphertext);
    const calculatedMac = hmac.digest();

    if (!crypto.timingSafeEqual(mac, calculatedMac)) {
      return false; // Integrity check failed
    }

    // AES-256-CBC decrypt
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  } catch {
    return false;
  }
}

/**
 * Censor a phone number for display (e.g. +62812xxxxx34)
 */
export function censorPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.length < 7) return 'xxxxx';
  return (
    phoneNumber.substring(0, 6) +
    'xxxxx' +
    phoneNumber.substring(11)
  );
}
