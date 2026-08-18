/**
 * chatTypes.js — Types, Constants, and Enums for bitchat integration
 */

export const MESSAGE_STATE = {
  PENDING: 'pending',     // Saved locally, not sent yet
  SENDING: 'sending',     // Currently attempting transmission
  SENT: 'sent',           // Transmitted via active transport
  DELIVERED: 'delivered', // Confirmed received by recipient/mesh peer
  READ: 'read',           // Read by recipient
  FAILED: 'failed',       // Transmission error
  OFFLINE: 'offline',     // Queued in local outbox (no network/peers)
  RELAYED: 'relayed',     // Transmitted via multi-hop mesh node
  SYNCED: 'synced',       // Synchronized to Supabase database
};

export const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  VOICE: 'voice',
  FILE: 'file',
  SYSTEM: 'system',
  HANDSHAKE: 'handshake',
};

export const CONNECTION_STATUS = {
  ONLINE: 'online',   // Supabase Realtime active
  MESH: 'mesh',       // BLE Mesh active
  SYNCING: 'syncing', // Syncing outbox to Supabase
  OFFLINE: 'offline', // Disconnected
};

export const PROTOCOL_VERSION = 1;
export const DEFAULT_MAX_HOPS = 7;
export const DEFAULT_TTL_SECONDS = 86400; // 24 hours
