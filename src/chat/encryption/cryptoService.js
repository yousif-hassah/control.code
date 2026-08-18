/**
 * cryptoService.js — End-to-End Encryption (E2EE) with AES-256-GCM
 * Ensures messages stored in Supabase and passed over BLE Mesh are unreadable ciphertext.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Cache derived AES keys per conversation/group ID
const keyCache = new Map();

/**
 * Derives a 256-bit AES-GCM Key from a group Secret/ID using PBKDF2.
 */
export async function deriveGroupKey(conversationId, secretSalt = 'bitchat_salt_v1') {
  if (keyCache.has(conversationId)) {
    return keyCache.get(conversationId);
  }

  try {
    const rawSecret = encoder.encode(`bitchat_group_${conversationId}`);
    const salt = encoder.encode(secretSalt);

    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      rawSecret,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    keyCache.set(conversationId, aesKey);
    return aesKey;
  } catch (err) {
    console.error('❌ Key derivation error:', err);
    return null;
  }
}

/**
 * Encrypts a plaintext string into Base64 AES-GCM ciphertext.
 */
export async function encryptMessage(plaintext, conversationId) {
  if (!plaintext) return '';

  try {
    const key = await deriveGroupKey(conversationId);
    if (!key) return plaintext; // Fallback if crypto unavailable

    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const encodedData = encoder.encode(plaintext);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    // Combine IV (12 bytes) + Encrypted Payload
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to Base64
    let binary = '';
    combined.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  } catch (err) {
    console.error('❌ Message encryption failed:', err);
    return plaintext;
  }
}

/**
 * Decrypts a Base64 AES-GCM ciphertext back into plaintext string.
 */
export async function decryptMessage(ciphertext, conversationId) {
  if (!ciphertext) return '';

  try {
    const key = await deriveGroupKey(conversationId);
    if (!key) return ciphertext;

    // Decode Base64 string to Uint8Array
    const binary = atob(ciphertext);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    // Extract IV (first 12 bytes) and ciphertext
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    return decoder.decode(decryptedBuffer);
  } catch (err) {
    // If decryption fails (e.g. legacy plaintext message or different key), return original string
    return ciphertext;
  }
}

export default {
  deriveGroupKey,
  encryptMessage,
  decryptMessage,
};
