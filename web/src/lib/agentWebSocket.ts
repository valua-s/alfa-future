import type { AgentKey } from "../types/agent";

export type AgentAttachmentReference = {
  id: string;
  path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
};

export type SendAgentMessagePayload = {
  agent: AgentKey;
  text: string;
  sessionId?: number;
  files?: AgentAttachmentReference[];
};

type AgentConnectionStatus = "idle" | "connecting" | "open" | "closed" | "error";

export type AgentServerEvent =
  | { type: "connected"; user_id: number }
  | {
      type: "session_ready";
      session_id: number;
      user_message_id: number;
      attachments: AgentAttachmentReference[];
    }
  | {
      type: "agent_event";
      session_id: number;
      event: Record<string, unknown>;
    }
  | {
      type: "agent_response";
      session_id: number;
      answer: string;
      plan: unknown[];
      tool_results: unknown[];
      events: unknown[];
      llm_stats: Record<string, unknown>;
      llm_backend: Record<string, unknown>;
      agent_message_id: number;
    }
  | { type: "agent_error"; session_id: number; message: string }
  | { type: "error"; message: string };

type EventMap = {
  status: AgentConnectionStatus;
  message: AgentServerEvent;
};

export class AgentWebSocketClient {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private status: AgentConnectionStatus = "idle";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: { [K in keyof EventMap]: Set<(payload: EventMap[K]) => void> } = {
    status: new Set(),
    message: new Set(),
  };
  private pending: SendAgentMessagePayload[] = [];
  private manualClose = false;

  connect(token: string) {
    this.token = token;
    if (this.socket && this.status === "open") return;
    this.manualClose = false;
    this.updateStatus("connecting");
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${window.location.host}/api/agent/ws?token=${encodeURIComponent(token)}`;
    this.socket = new WebSocket(url);
    this.socket.addEventListener("open", this.handleOpen);
    this.socket.addEventListener("message", this.handleMessage);
    this.socket.addEventListener("close", this.handleClose);
    this.socket.addEventListener("error", this.handleError);
  }

  disconnect() {
    this.manualClose = true;
    this.clearReconnectTimer();
    if (this.socket) {
      this.socket.removeEventListener("open", this.handleOpen);
      this.socket.removeEventListener("message", this.handleMessage);
      this.socket.removeEventListener("close", this.handleClose);
      this.socket.removeEventListener("error", this.handleError);
      this.socket.close();
      this.socket = null;
    }
    this.updateStatus("closed");
  }

  send(payload: SendAgentMessagePayload) {
    const message = JSON.stringify({
      type: "user_message",
      agent: payload.agent,
      text: payload.text,
      session_id: payload.sessionId,
      files: payload.files ?? [],
    });
    if (this.socket && this.status === "open") {
      this.socket.send(message);
    } else {
      this.pending.push(payload);
    }
  }

  on<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void) {
    this.listeners[event].add(handler);
    return () => this.listeners[event].delete(handler);
  }

  getStatus(): AgentConnectionStatus {
    return this.status;
  }

  private handleOpen = () => {
    this.updateStatus("open");
    this.reconnectAttempts = 0;
    this.flushQueue();
  };

  private handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as AgentServerEvent;
      this.emit("message", data);
    } catch {
      return;
    }
  };

  private handleClose = () => {
    this.socket = null;
    if (this.manualClose) {
      this.updateStatus("closed");
      return;
    }
    this.updateStatus("closed");
    this.scheduleReconnect();
  };

  private handleError = () => {
    this.updateStatus("error");
    if (!this.manualClose) {
      this.scheduleReconnect();
    }
  };

  private flushQueue() {
    if (!this.socket || this.status !== "open") return;
    this.pending.forEach((payload) => this.send(payload));
    this.pending = [];
  }

  private scheduleReconnect() {
    if (!this.token) return;
    this.clearReconnectTimer();
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private updateStatus(status: AgentConnectionStatus) {
    this.status = status;
    this.emit("status", status);
  }

  private emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    this.listeners[event].forEach((handler) => handler(payload));
  }
}

export const agentWebSocket = new AgentWebSocketClient();

