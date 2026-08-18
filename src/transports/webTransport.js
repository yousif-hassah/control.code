/**
 * webTransport.js — Web Client Transport Handler
 */

import { supabaseTransport } from './supabaseTransport';
import { bleTransport } from './bleTransport';

class WebTransport {
  async send(envelope, decryptedText) {
    if (navigator.onLine) {
      return await supabaseTransport.sendMessage(envelope, decryptedText);
    } else {
      return await bleTransport.broadcastMessage(envelope);
    }
  }

  subscribeGroup(groupId, callback) {
    const unsubSupabase = supabaseTransport.subscribeToGroup(groupId, callback);
    const unsubMesh = bleTransport.onMessage(callback);

    return () => {
      unsubSupabase();
      unsubMesh();
    };
  }
}

export const webTransport = new WebTransport();
export default webTransport;
