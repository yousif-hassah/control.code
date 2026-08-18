/**
 * bleTransport.js — Bluetooth Mesh Transport & Local Peer Discovery
 * Supports Native BLE Mesh (Android/iOS via Capacitor) and Web BroadcastChannel for local development.
 */

import { serialize, deserialize, incrementHop, validateEnvelope } from '../chat/messageProtocol';
import { MESSAGE_STATE } from '../chat/chatTypes';

class BLETransport {
  constructor() {
    this.peers = new Set();
    this.messageListeners = new Set();
    this.broadcastChannel = null;

    this.initWebMeshFallback();
  }

  /**
   * Initializes local Web BroadcastChannel so multiple tabs/devices on local network act as Mesh Nodes.
   */
  initWebMeshFallback() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('bitchat_mesh_channel');
      this.broadcastChannel.onmessage = (event) => {
        this.handleIncomingMeshPacket(event.data);
      };
      console.log('🔵 BLE Mesh (Web Fallback Channel) active');
    }
  }

  /**
   * Checks if browser supports Web Bluetooth API.
   */
  isWebBluetoothSupported() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Scans for nearby BLE Mesh devices via Web Bluetooth API if available.
   */
  async requestBluetoothDevice() {
    if (!this.isWebBluetoothSupported()) {
      return { success: false, reason: 'Web Bluetooth API not supported in this browser' };
    }
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb'],
      });
      if (device) {
        this.peers.add(device.id || device.name);
        return { success: true, device };
      }
    } catch (err) {
      return { success: false, reason: err.message };
    }
  }

  /**
   * Registers a listener for incoming mesh messages.
   */
  onMessage(listener) {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  /**
   * Transmits a packet over BLE Mesh network.
   */
  async broadcastMessage(envelope) {
    const { valid, reason } = validateEnvelope(envelope);
    if (!valid) {
      console.warn(`⚠️ Cannot broadcast invalid packet over Mesh: ${reason}`);
      return { success: false, reason };
    }

    try {
      const packetStr = serialize(envelope);

      // Broadcast over Web BroadcastChannel (local mesh node)
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(packetStr);
      }

      // If running inside Capacitor Native Mobile container with BLE plugin:
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BLEMesh) {
        await window.Capacitor.Plugins.BLEMesh.broadcastPacket({ packet: packetStr });
      }

      return { success: true, status: MESSAGE_STATE.RELAYED };
    } catch (err) {
      console.error('❌ BLE Mesh broadcast error:', err);
      return { success: false, reason: err.message };
    }
  }

  /**
   * Handles incoming packet from mesh node, performs TTL/hop validation, and relays if needed.
   */
  async handleIncomingMeshPacket(rawPacket) {
    const envelope = deserialize(rawPacket);
    if (!envelope) return;

    // Notify local listeners
    this.messageListeners.forEach((listener) => listener(envelope));

    // Relay packet to next hop if hopCount < maxHops
    if (envelope.hopCount < envelope.maxHops) {
      const relayedEnvelope = incrementHop(envelope);
      setTimeout(() => {
        this.broadcastMessage(relayedEnvelope);
      }, Math.floor(Math.random() * 500) + 100); // Random backoff to prevent collisions
    }
  }
}

export const bleTransport = new BLETransport();
export default bleTransport;
