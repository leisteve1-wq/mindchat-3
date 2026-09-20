// ============================================
// Simple Crypto Utilities for MindChat
// ============================================

/**
 * Simple SHA-256 hash function for password encryption
 * Note: In production, use a proper library like bcrypt
 */
export const sha256 = async (message: string): Promise<string> => {
  // Encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);
  
  // Hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  
  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

/**
 * Simple encryption for sensitive data
 */
export const encrypt = (text: string, key: string): string => {
  try {
    const encoded = btoa(text);
    return encoded.split('').map((char, i) => {
      const keyChar = key[i % key.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
  } catch {
    return text;
  }
};

/**
 * Simple decryption
 */
export const decrypt = (encrypted: string, key: string): string => {
  try {
    const decoded = encrypted.split('').map((char, i) => {
      const keyChar = key[i % key.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
    return atob(decoded);
  } catch {
    return encrypted;
  }
};

/**
 * Generate a random key
 */
export const generateKey = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
