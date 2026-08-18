/**
 * messageProtocol.js — Transport-independent Envelope Format & Validation
 */

import { PROTOCOL_VERSION, DEFAULT_MAX_HOPS, DEFAULT_TTL_SECONDS, MESSAGE_STATE, MESSAGE_TYPE } from './chatTypes';

/**
 * Generates a RFC4122 v4 compliant UUID string.
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a valid protocol message envelope.
 */
export function createEnvelope({
  id = null,
  conversationId,
  senderId,
  senderDeviceId,
  type = MESSAGE_TYPE.TEXT,
  ciphertext = '',
  createdAt = Date.now(),
  ttl = DEFAULT_TTL_SECONDS,
  hopCount = 0,
  maxHops = DEFAULT_MAX_HOPS,
  replyTo = null,
  attachmentId = null,
  signature = '',
  status = MESSAGE_STATE.PENDING,
  metadata = {},
}) {
  const messageId = id || generateUUID();

  return {
    id: messageId,
    conversationId: String(conversationId),
    senderId: String(senderId),
    senderDeviceId: String(senderDeviceId || 'browser_client'),
    type,
    ciphertext,
    createdAt: Number(createdAt),
    ttl: Number(ttl),
    hopCount: Number(hopCount),
    maxHops: Number(maxHops),
    replyTo: replyTo ? String(replyTo) : null,
    attachmentId: attachmentId ? String(attachmentId) : null,
    signature,
    status,
    protocolVersion: PROTOCOL_VERSION,
    metadata,
  };
}

/**
 * Validates whether an incoming packet conforms to the protocol specs.
 */
export function validateEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object') {
    return { valid: false, reason: 'Envelope must be a non-null object' };
  }

  if (!envelope.id || typeof envelope.id !== 'string') {
    return { valid: false, reason: 'Missing or invalid "id"' };
  }

  if (!envelope.conversationId) {
    return { valid: false, reason: 'Missing "conversationId"' };
  }

  if (!envelope.senderId) {
    return { valid: false, reason: 'Missing "senderId"' };
  }

  if (typeof envelope.protocolVersion !== 'number' || envelope.protocolVersion > PROTOCOL_VERSION) {
    return { valid: false, reason: `Unsupported protocolVersion: ${envelope.protocolVersion}` };
  }

  if (typeof envelope.hopCount !== 'number' || typeof envelope.maxHops !== 'number') {
    return { valid: false, reason: 'Invalid hop metrics' };
  }

  if (envelope.hopCount >= envelope.maxHops) {
    return { valid: false, reason: 'Max hops exceeded' };
  }

  // Check TTL expiration if createdAt is provided
  if (envelope.createdAt && envelope.ttl) {
    const ageInSeconds = (Date.now() - envelope.createdAt) / 1000;
    if (ageInSeconds > envelope.ttl) {
      return { valid: false, reason: 'Message TTL expired' };
    }
  }

  return { valid: true };
}

/**
 * Serializes envelope for Bluetooth Mesh / Wire transmission.
 */
export function serialize(envelope) {
  const { valid, reason } = validateEnvelope(envelope);
  if (!valid) {
    throw new Error(`Cannot serialize invalid envelope: ${reason}`);
  }
  return JSON.stringify(envelope);
}

/**
 * Deserializes raw wire format string back into an envelope object.
 */
export function deserialize(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const validation = validateEnvelope(parsed);
    if (!validation.valid) {
      console.warn(`⚠️ Rejected invalid message packet: ${validation.reason}`, parsed);
      return null;
    }
    return parsed;
  } catch (err) {
    console.error('❌ Failed to deserialize message packet:', err);
    return null;
  }
}

/**
 * Increments hop count for multi-hop mesh relaying.
 */
export function incrementHop(envelope) {
  return {
    ...envelope,
    hopCount: (envelope.hopCount || 0) + 1,
    status: MESSAGE_STATE.RELAYED,
  };
}

export default {
  createEnvelope,
  validateEnvelope,
  serialize,
  deserialize,
  incrementHop,
};
