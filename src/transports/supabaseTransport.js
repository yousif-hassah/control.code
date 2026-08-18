/**
 * supabaseTransport.js — Online Supabase Transport Implementation
 */

import { supabase } from '../lib/supabaseClient';
import { MESSAGE_STATE } from '../chat/chatTypes';

class SupabaseTransport {
  constructor() {
    this.activeChannels = new Map();
  }

  /**
   * Sends envelope to Supabase group_messages table.
   */
  async sendMessage(envelope, decryptedText = '') {
    if (!navigator.onLine || !supabase) {
      return { success: false, reason: 'Offline or Supabase client missing' };
    }

    try {
      const payload = {
        id: envelope.id,
        group_id: envelope.conversationId,
        user_id: envelope.senderId,
        message: decryptedText || envelope.ciphertext || 'Encrypted Message',
        created_at: new Date(envelope.createdAt || Date.now()).toISOString(),
        device_id: envelope.senderDeviceId || null,
        ciphertext: envelope.ciphertext || null,
        signature: envelope.signature || null,
        protocol_version: envelope.protocolVersion || 1,
        hop_count: envelope.hopCount || 0,
        status: MESSAGE_STATE.SYNCED,
        file_url: envelope.metadata?.fileUrl || envelope.attachmentId || null,
        file_name: envelope.metadata?.fileName || null,
        file_type: envelope.metadata?.fileType || null,
      };

      const { data, error } = await supabase
        .from('group_messages')
        .insert([payload])
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log(`ℹ️ SupabaseTransport: Message ${envelope.id} already exists in DB (Deduplicated).`);
          return { success: true, duplicate: true, status: MESSAGE_STATE.SYNCED };
        }
        throw error;
      }

      return { success: true, data, status: MESSAGE_STATE.SYNCED };
    } catch (err) {
      console.warn('⚠️ SupabaseTransport send error:', err.message);
      return { success: false, reason: err.message };
    }
  }

  /**
   * Subscribes to real-time message changes for a given group.
   */
  subscribeToGroup(groupId, onMessageReceived) {
    if (!groupId || !supabase) return () => {};

    if (this.activeChannels.has(groupId)) {
      return () => this.unsubscribe(groupId);
    }

    const channel = supabase
      .channel(`bitchat_group_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          if (payload.new && onMessageReceived) {
            onMessageReceived(payload.new);
          }
        }
      )
      .subscribe();

    this.activeChannels.set(groupId, channel);

    return () => this.unsubscribe(groupId);
  }

  unsubscribe(groupId) {
    if (this.activeChannels.has(groupId)) {
      const channel = this.activeChannels.get(groupId);
      supabase.removeChannel(channel);
      this.activeChannels.delete(groupId);
    }
  }
}

export const supabaseTransport = new SupabaseTransport();
export default supabaseTransport;
