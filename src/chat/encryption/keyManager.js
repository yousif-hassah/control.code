/**
 * keyManager.js — Device Identity & Key Pair Management using Web Crypto API
 * Safe for browser and WebWorker environments. Never logs or leaks private keys.
 */

const DEVICE_ID_KEY = 'bitchat_device_id';
const IDENTITY_STORE_NAME = 'device_identities';

let cachedDeviceId = null;
let cachedKeyPair = null;

/**
 * Gets or creates unique local Device ID.
 */
export function getDeviceId() {
  if (cachedDeviceId) return cachedDeviceId;
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? `dev_${crypto.randomUUID()}`
      : `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  cachedDeviceId = deviceId;
  return deviceId;
}

/**
 * Generates an ECDH key pair for key exchange (P-256 curve).
 */
export async function generateECDHKeyPair() {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    console.warn('⚠️ Web Crypto API not supported in this environment');
    return null;
  }

  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      false, // non-extractable private key
      ['deriveKey', 'deriveBits']
    );
    cachedKeyPair = keyPair;
    return keyPair;
  } catch (err) {
    console.error('❌ Failed to generate ECDH key pair:', err);
    return null;
  }
}

/**
 * Exports public key as Base64 JSON Web Key (JWK) for broadcasting to peers.
 */
export async function exportPublicKeyJWK(publicKey) {
  try {
    const exported = await window.crypto.subtle.exportKey('jwk', publicKey);
    return btoa(JSON.stringify(exported));
  } catch (err) {
    console.error('❌ Error exporting public key:', err);
    return null;
  }
}

/**
 * Imports a peer's public key from Base64 JWK.
 */
export async function importPublicKeyJWK(base64Jwk) {
  try {
    const jwk = JSON.parse(atob(base64Jwk));
    return await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      []
    );
  } catch (err) {
    console.error('❌ Error importing public key:', err);
    return null;
  }
}

/**
 * Derives a shared AES-256-GCM key from local private key and peer public key (ECDH).
 */
export async function deriveSharedSecretKey(localPrivateKey, peerPublicKey) {
  try {
    return await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: peerPublicKey,
      },
      localPrivateKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (err) {
    console.error('❌ Error deriving shared secret key:', err);
    return null;
  }
}

export default {
  getDeviceId,
  generateECDHKeyPair,
  exportPublicKeyJWK,
  importPublicKeyJWK,
  deriveSharedSecretKey,
};
