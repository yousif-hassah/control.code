/**
 * messageStore.js — Persistent Storage & Deduplication Management
 * Handles local IndexedDB operations for messages, outbox queue, and processed message IDs.
 */

import { dbGet, dbGetAll, dbPut, dbDelete, STORES } from '../lib/offlineDB';
import { MESSAGE_STATE } from './chatTypes';

/**
 * Checks if a message has already been processed to prevent duplicates (bitchat deduplication).
 */
export async function isProcessed(messageId) {
  if (!messageId) return false;
  try {
    const record = await dbGet(STORES.processedMsgIds, messageId);
    return !!record;
  } catch (err) {
    return false;
  }
}

/**
 * Marks a message ID as processed.
 */
export async function markProcessed(messageId) {
  if (!messageId) return;
  try {
    await dbPut(STORES.processedMsgIds, {
      id: messageId,
      processedAt: Date.now(),
    });
  } catch (err) {
    console.warn('⚠️ Error marking message processed:', err);
  }
}

/**
 * Saves a message envelope into local store if not already present.
 */
export async function saveMessage(envelope) {
  if (!envelope || !envelope.id) return null;

  try {
    await dbPut(STORES.chatMessages, envelope);
    await markProcessed(envelope.id);
    return envelope;
  } catch (err) {
    console.error('❌ Failed to save message to IndexedDB:', err);
    return null;
  }
}

/**
 * Gets all messages for a specific group/conversation ordered by creation date.
 */
export async function getConversationMessages(conversationId) {
  try {
    const all = await dbGetAll(STORES.chatMessages, 'conversationId', String(conversationId));
    return all.sort((a, b) => a.createdAt - b.createdAt);
  } catch (err) {
    console.error('❌ Failed to fetch conversation messages:', err);
    return [];
  }
}

/**
 * Adds an envelope to the Outbox queue for offline retry / mesh relay.
 */
export async function addToOutbox(envelope) {
  if (!envelope || !envelope.id) return;
  try {
    const outboxRecord = {
      ...envelope,
      status: envelope.status || MESSAGE_STATE.OFFLINE,
      queuedAt: Date.now(),
    };
    await dbPut(STORES.chatOutbox, outboxRecord);
  } catch (err) {
    console.error('❌ Failed to add to outbox:', err);
  }
}

/**
 * Retrieves all pending outbox items ready for transmission or sync.
 */
export async function getOutboxMessages() {
  try {
    return await dbGetAll(STORES.chatOutbox);
  } catch (err) {
    console.error('❌ Failed to get outbox messages:', err);
    return [];
  }
}

/**
 * Removes an envelope from Outbox after successful sync / transmission.
 */
export async function removeFromOutbox(messageId) {
  try {
    await dbDelete(STORES.chatOutbox, messageId);
  } catch (err) {
    console.warn('⚠️ Failed to remove from outbox:', err);
  }
}

/**
 * Updates message status in local DB.
 */
export async function updateMessageStatus(messageId, status) {
  try {
    const existing = await dbGet(STORES.chatMessages, messageId);
    if (existing) {
      const updated = { ...existing, status };
      await dbPut(STORES.chatMessages, updated);
      return updated;
    }
  } catch (err) {
    console.warn('⚠️ Error updating message status:', err);
  }
  return null;
}

export default {
  isProcessed,
  markProcessed,
  saveMessage,
  getConversationMessages,
  addToOutbox,
  getOutboxMessages,
  removeFromOutbox,
  updateMessageStatus,
};
