// Real-time Multi-Tab Synchronizer for Tara Web, Mobile & Soundbox

export interface RealtimePaymentEvent {
  type: 'PAYMENT_RECEIVED';
  id: string;
  amount: number;
  customer: string;
  vpa?: string;
  mode: string;
  timestamp: string;
  shouldAnnounce?: boolean;
}

export interface RealtimeDeviceEvent {
  type: 'DEVICE_STATUS_CHANGED';
  deviceId: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  battery: number;
  lastSeen?: string;
}

export type RealtimeEvent = RealtimePaymentEvent | RealtimeDeviceEvent;

const CHANNEL_NAME = 'tara_realtime_ecosystem_bus';

class RealtimeSyncBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: RealtimeEvent) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data) {
            this.notify(event.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization error:', err);
      }

      // Storage event fallback for older browser tabs or iframe contexts
      window.addEventListener('storage', (e) => {
        if (e.key === 'tara_realtime_sync_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notify(data.event);
          } catch {}
        }
      });
    }
  }

  public broadcast(event: RealtimeEvent) {
    // 1. Post to BroadcastChannel for instant same-origin tab messaging
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (err) {
        console.warn('Broadcast channel post failed', err);
      }
    }

    // 2. Set localStorage to trigger storage events across all tabs
    try {
      localStorage.setItem('tara_realtime_sync_event', JSON.stringify({
        event,
        time: Date.now(),
        random: Math.random()
      }));
    } catch {}

    // 3. Notify local listeners in the current tab as well
    this.notify(event);
  }

  public subscribe(listener: (event: RealtimeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: RealtimeEvent) {
    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error('Error in realtime event listener:', err);
      }
    });
  }
}

export const realtimeBus = new RealtimeSyncBus();
