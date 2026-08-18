/**
 * chatService.js — High Level Facade for Chat Infrastructure
 * The UI layer (GroupDetailScreen.jsx) interacts ONLY with ChatService.
 */

import { createEnvelope } from './messageProtocol';
import { encryptMessage, decryptMessage } from './encryption/cryptoService';
import { getDeviceId } from './encryption/keyManager';
import { saveMessage, getConversationMessages, addToOutbox, updateMessageStatus } from './messageStore';
import { webTransport } from '../transports/webTransport';
import { syncEngine } from './syncEngine';
import { relayEngine } from './relayEngine';
import { MESSAGE_STATE, CONNECTION_STATUS } from './chatTypes';

class ChatService {
  constructor() {
    this.deviceId = getDeviceId();
  }

  /**
   * Gets current overall connection status.
   */
  getConnectionStatus() {
    if (syncEngine.isSyncing) return CONNECTION_STATUS.SYNCING;
    if (navigator.onLine) return CONNECTION_STATUS.ONLINE;
    return CONNECTION_STATUS.MESH; // BLE Mesh fallback when internet is off
  }

  /**
   * Sends a message (Text or File Attachment) using bitchat protocol.
   */
  async sendMessage({ conversationId, senderId, text = '', fileUrl = null, fileName = null, fileType = null, replyTo = null }) {
    // 1. Encrypt message text
    const ciphertext = await encryptMessage(text, conversationId);

    // 2. Create protocol envelope
    const envelope = createEnvelope({
      conversationId,
      senderId,
      senderDeviceId: this.deviceId,
      type: fileType || 'text',
      ciphertext,
      replyTo,
      attachmentId: fileUrl,
      status: navigator.onLine ? MESSAGE_STATE.SENDING : MESSAGE_STATE.OFFLINE,
      metadata: {
        decryptedMessage: text,
        fileName,
        fileUrl,
        fileType,
      },
    });

    // 3. Persist locally first (Offline-First guarantee)
    await saveMessage(envelope);

    // 4. Send via Transport
    if (navigator.onLine) {
      const result = await webTransport.send(envelope, text);
      if (result.success) {
        await updateMessageStatus(envelope.id, MESSAGE_STATE.SYNCED);
        return { envelope: { ...envelope, status: MESSAGE_STATE.SYNCED }, result };
      }
    }

    // 5. If offline or send failed -> Add to Outbox and broadcast over BLE Mesh
    await addToOutbox(envelope);
    await webTransport.send(envelope, text); // Will broadcast to Mesh if offline

    return { envelope: { ...envelope, status: MESSAGE_STATE.OFFLINE }, result: { success: true } };
  }

  /**
   * Loads initial conversation messages from local IndexedDB.
   */
  async loadConversationMessages(conversationId) {
    const envelopes = await getConversationMessages(conversationId);
    for (const env of envelopes) {
      if (env.ciphertext && !env.metadata?.decryptedMessage) {
        const decrypted = await decryptMessage(env.ciphertext, conversationId);
        env.metadata = { ...(env.metadata || {}), decryptedMessage: decrypted };
      }
    }
    return envelopes;
  }

  /**
   * Subscribes to real-time & mesh messages for a group.
   */
  subscribeToGroup(groupId, onMessageCallback) {
    return webTransport.subscribeGroup(groupId, async (rawOrEnvelope) => {
      let envelope = rawOrEnvelope;

      // Handle raw Supabase message format conversion
      if (rawOrEnvelope && rawOrEnvelope.group_id && !rawOrEnvelope.conversationId) {
        envelope = createEnvelope({
          id: rawOrEnvelope.id,
          conversationId: rawOrEnvelope.group_id,
          senderId: rawOrEnvelope.user_id,
          ciphertext: rawOrEnvelope.message,
          createdAt: new Date(rawOrEnvelope.created_at).getTime(),
          status: MESSAGE_STATE.SYNCED,
          metadata: {
            decryptedMessage: rawOrEnvelope.message,
            fileUrl: rawOrEnvelope.file_url,
            fileName: rawOrEnvelope.file_name,
            fileType: rawOrEnvelope.file_type,
          },
        });
      }

      // Decrypt message if ciphertext is encrypted
      if (envelope.ciphertext && !envelope.metadata?.decryptedMessage) {
        const decrypted = await decryptMessage(envelope.ciphertext, envelope.conversationId);
        envelope.metadata = { ...envelope.metadata, decryptedMessage: decrypted };
      }

      // Save locally & notify UI
      await saveMessage(envelope);
      onMessageCallback(envelope);
    });
  }

  /**
   * Caches remote messages from Supabase into local IndexedDB store.
   */
  async cacheRemoteMessages(messages = []) {
    for (const m of messages) {
      if (!m || !m.id) continue;
      const envelope = createEnvelope({
        id: m.id,
        conversationId: m.group_id || m.conversationId,
        senderId: m.user_id || m.senderId,
        ciphertext: m.ciphertext || m.message,
        createdAt: m.created_at ? new Date(m.created_at).getTime() : (m.createdAt || Date.now()),
        status: m.status || MESSAGE_STATE.SYNCED,
        metadata: {
          decryptedMessage: m.message || m.ciphertext,
          fileUrl: m.file_url || m.metadata?.fileUrl,
          fileName: m.file_name || m.metadata?.fileName,
          fileType: m.file_type || m.metadata?.fileType,
        },
      });
      await saveMessage(envelope);
    }
  }

  /**
   * Triggers manual Outbox sync.
   */
  async syncNow() {
    return await syncEngine.syncOutbox();
  }
}

export const chatService = new ChatService();
export default chatService;
