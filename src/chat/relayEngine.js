/**
 * relayEngine.js — Multi-Hop Packet Relay & Cloud Bridge Engine
 * Handles BLE Mesh multi-hop propagation, deduplication, and cloud bridging when internet is present.
 */

import { bleTransport } from '../transports/bleTransport';
import { supabaseTransport } from '../transports/supabaseTransport';
import { isProcessed, saveMessage, markProcessed } from './messageStore';
import { incrementHop, validateEnvelope } from './messageProtocol';

class RelayEngine {
  constructor() {
    this.initRelayListener();
  }

  /**
   * Initializes incoming BLE Mesh message listener for relaying and cloud bridging.
   */
  initRelayListener() {
    bleTransport.onMessage(async (envelope) => {
      if (!envelope || !envelope.id) return;

      // 1. Check deduplication to prevent relay loops
      const alreadyProcessed = await isProcessed(envelope.id);
      if (alreadyProcessed) return;

      // 2. Validate message envelope
      const { valid } = validateEnvelope(envelope);
      if (!valid) return;

      // 3. Mark processed and save locally
      await markProcessed(envelope.id);
      await saveMessage(envelope);

      // 4. Cloud Bridging: If this device has Internet, bridge the relayed mesh message to Supabase
      if (navigator.onLine) {
        try {
          const decryptedText = envelope.metadata?.decryptedMessage || envelope.ciphertext || '';
          await supabaseTransport.sendMessage(envelope, decryptedText);
          console.log(`🌐 RelayEngine: Bridged BLE mesh message ${envelope.id} to Supabase cloud!`);
        } catch (err) {
          console.warn('⚠️ Cloud bridge attempt failed:', err);
        }
      }

      // 5. Multi-hop propagation: Relay to next hop if maxHops limit not reached
      if (envelope.hopCount < envelope.maxHops) {
        const relayedEnvelope = incrementHop(envelope);
        const jitterMs = Math.floor(Math.random() * 400) + 100;

        setTimeout(async () => {
          await bleTransport.broadcastMessage(relayedEnvelope);
          console.log(`📡 RelayEngine: Relayed packet ${envelope.id} (Hop: ${relayedEnvelope.hopCount}/${relayedEnvelope.maxHops})`);
        }, jitterMs);
      }
    });
  }
}

export const relayEngine = new RelayEngine();
export default relayEngine;
