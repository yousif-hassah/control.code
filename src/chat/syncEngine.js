/**
 * syncEngine.js — Offline Outbox Sync Engine
 * Flushes pending outbox messages when internet connectivity returns.
 */

import { getOutboxMessages, removeFromOutbox, updateMessageStatus } from './messageStore';
import { supabaseTransport } from '../transports/supabaseTransport';
import { MESSAGE_STATE } from './chatTypes';

class SyncEngine {
  constructor() {
    this.isSyncing = false;
    this.statusListeners = new Set();
    this.initNetworkListener();
  }

  initNetworkListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 Internet connection restored — Triggering SyncEngine');
        this.syncOutbox();
      });

      // Periodic check for unsent outbox messages when online
      setInterval(() => {
        if (navigator.onLine && !this.isSyncing) {
          this.syncOutbox();
        }
      }, 10000);
    }
  }

  onStatusChange(listener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  notifyStatus(status) {
    this.statusListeners.forEach((l) => l(status));
  }

  /**
   * Flushes outbox queue to Supabase.
   */
  async syncOutbox() {
    if (!navigator.onLine || this.isSyncing) return { synced: 0, failed: 0 };

    this.isSyncing = true;
    this.notifyStatus('syncing');

    const pendingMsgs = await getOutboxMessages();
    if (pendingMsgs.length === 0) {
      this.isSyncing = false;
      this.notifyStatus('online');
      return { synced: 0, failed: 0 };
    }

    console.log(`🔄 SyncEngine: Flushing ${pendingMsgs.length} pending outbox messages...`);

    let synced = 0;
    let failed = 0;

    for (const envelope of pendingMsgs) {
      try {
        const decryptedText = envelope.metadata?.decryptedMessage || envelope.ciphertext;
        const result = await supabaseTransport.sendMessage(envelope, decryptedText);

        if (result.success) {
          await removeFromOutbox(envelope.id);
          await updateMessageStatus(envelope.id, MESSAGE_STATE.SYNCED);
          synced++;
        } else {
          failed++;
        }
      } catch (err) {
        console.warn('⚠️ SyncEngine message error:', err);
        failed++;
      }
    }

    this.isSyncing = false;
    this.notifyStatus(navigator.onLine ? 'online' : 'offline');

    console.log(`✅ SyncEngine complete: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  }
}

export const syncEngine = new SyncEngine();
export default syncEngine;
