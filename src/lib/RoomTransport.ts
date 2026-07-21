import { ClockSync } from "./ClockSync";
import { TransportState } from "./roomTypes";
import { decompress } from "@/lib/compress";

const BASE_DELAY = 1000;
const MAX_DELAY = 30000;

interface ServerMsg {
  type: string;
  [key: string]: any;
}

export class RoomTransport {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private dead = false;

  constructor(
    private readonly wsUrl: string,
    public readonly clock: ClockSync,
    private readonly onMessage: (msg: any) => void,
    private readonly onStateChange: (state: TransportState) => void,
  ) {}

  connect() {
    if (this.dead) return;
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (this.ws?.readyState === WebSocket.CONNECTING) return;

    const ws = new WebSocket(this.wsUrl);
    this.ws = ws;
    this.onStateChange("connecting");

    ws.onopen = async () => {
      if (this.ws !== ws) return;
      this.attempt = 0;
      await this.clock.calibrate((msg) => this.send(msg));
      if (this.ws !== ws) return;
      this.onStateChange("connected");
    };

    ws.onmessage = (evt) => {
      if (this.ws !== ws) return;
      let raw = evt.data;
      try { raw = decompress(evt.data); } catch {}
      let msg: any;
      try { msg = JSON.parse(raw); } catch { return; }

      if (msg.type === "clock:pong") {
        this.clock.handlePong(msg.t0, msg.serverTime);
        return;
      }
      if (msg.type === "clock_sync") {
        this.clock.handleClockSync(msg.serverTime);
        return;
      }
      this.onMessage(msg);
    };

    ws.onclose = () => {
      if (this.ws !== ws) return;
      if (this.dead) return;
      this.ws = null;
      this.onStateChange("disconnected");
      const delay = Math.random() * Math.min(MAX_DELAY, BASE_DELAY * Math.pow(2, this.attempt));
      this.attempt++;
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    };

    ws.onerror = () => ws.close();
  }

  send(msg: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  destroy() {
    this.dead = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close(1000, "destroy");
      this.ws = null;
    }
  }
}
