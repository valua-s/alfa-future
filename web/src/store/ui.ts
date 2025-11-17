import { create } from "zustand";

import {
  agentWebSocket,
  type AgentAttachmentReference,
  type AgentServerEvent,
} from "../lib/agentWebSocket";
import type { AgentKey } from "../types/agent";

type AgentMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
  at: string;
  attachments?: AgentAttachmentReference[];
  sessionId?: number;
};

type AgentEventRecord = {
  id: string;
  sessionId: number;
  at: string;
  payload: Record<string, unknown>;
};

type AgentSessionState = {
  sessionId?: number;
  messages: AgentMessage[];
  events: AgentEventRecord[];
  status: "idle" | "pending" | "streaming" | "error";
  plan: unknown[];
  toolResults: unknown[];
  llmStats?: Record<string, unknown>;
  backendStats?: Record<string, unknown>;
  lastError?: string;
};

type UiState = {
  agentChatOpen: boolean;
  currentAgent: AgentKey | null;
  connectionStatus: ReturnType<typeof agentWebSocket.getStatus>;
  authToken: string | null;
  userId: number | null;
  sessions: Record<AgentKey, AgentSessionState>;
  pendingAttachments: Record<AgentKey, AgentAttachmentReference[]>;
  sessionAgentMap: Record<number, AgentKey>;
  pendingAgentQueue: AgentKey[];
  openAgentChat: (agent: AgentKey) => void;
  closeAgentChat: () => void;
  connect: (token: string) => void;
  uploadFiles: (agent: AgentKey, files: File[]) => Promise<void>;
  removeAttachment: (agent: AgentKey, id: string) => void;
  sendMessage: (agent: AgentKey, text: string) => Promise<void>;
};

const nowIso = () => new Date().toISOString();
const makeId = () => Math.random().toString(36).slice(2);

const emptySession = (): AgentSessionState => ({
  messages: [],
  events: [],
  status: "idle",
  plan: [],
  toolResults: [],
});

const baseSessions: Record<AgentKey, AgentSessionState> = {
  financier: emptySession(),
  lawyer: emptySession(),
  marketer: emptySession(),
  accountant: emptySession(),
};

const baseAttachments: Record<AgentKey, AgentAttachmentReference[]> = {
  financier: [],
  lawyer: [],
  marketer: [],
  accountant: [],
};

export const useUi = create<UiState>((set, get) => {
  agentWebSocket.on("status", (status) => set({ connectionStatus: status }));
  agentWebSocket.on("message", (event) => handleServerEvent(event, set, get));

  return {
  agentChatOpen: false,
  currentAgent: null,
    connectionStatus: agentWebSocket.getStatus(),
    authToken: null,
    userId: null,
    sessions: baseSessions,
    pendingAttachments: baseAttachments,
    sessionAgentMap: {},
    pendingAgentQueue: [],
  openAgentChat: (agent) => set({ agentChatOpen: true, currentAgent: agent }),
  closeAgentChat: () => set({ agentChatOpen: false }),
    connect: (token: string) => {
      set({ authToken: token });
      agentWebSocket.connect(token);
    },
    uploadFiles: async (agent, files) => {
      const token = get().authToken;
      if (!token || files.length === 0) return;
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));
      const response = await fetch("/api/agent/upload", {
        method: "POST",
        headers: {
          Authentication: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Не удалось загрузить файлы");
      }
      const data = (await response.json()) as { files: AgentAttachmentReference[] };
      set((state) => ({
        pendingAttachments: {
          ...state.pendingAttachments,
          [agent]: [...state.pendingAttachments[agent], ...(data.files ?? [])],
        },
      }));
    },
    removeAttachment: (agent, id) =>
      set((state) => ({
        pendingAttachments: {
          ...state.pendingAttachments,
          [agent]: state.pendingAttachments[agent].filter((file) => file.id !== id),
        },
      })),
    sendMessage: async (agent, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const state = get();
      const session = state.sessions[agent] ?? emptySession();
      const attachments = state.pendingAttachments[agent] ?? [];
      const message: AgentMessage = {
        id: makeId(),
        role: "user",
        text: trimmed,
        at: nowIso(),
        attachments,
        sessionId: session.sessionId,
      };
      set((current) => ({
        sessions: {
          ...current.sessions,
          [agent]: {
            ...current.sessions[agent],
            status: "pending",
            messages: [...current.sessions[agent].messages, message],
            lastError: undefined,
          },
        },
        pendingAttachments: { ...current.pendingAttachments, [agent]: [] },
        pendingAgentQueue:
          session.sessionId == null
            ? [...current.pendingAgentQueue, agent]
            : current.pendingAgentQueue,
      }));
      agentWebSocket.send({
        agent,
        text: trimmed,
        sessionId: session.sessionId ?? undefined,
        files: attachments,
      });
    },
  };
});

function handleServerEvent(
  event: AgentServerEvent,
  set: (fn: (state: UiState) => UiState) => void,
  get: () => UiState,
) {
  switch (event.type) {
    case "connected":
      set((state) => ({ ...state, userId: event.user_id }));
      return;
    case "session_ready": {
      const agent = resolveAgentForSession(event.session_id, set, get);
      if (!agent) return;
      set((state) => {
        const session = state.sessions[agent];
        const messages = session.messages.map((msg, idx, arr) =>
          idx === arr.length - 1 && msg.role === "user"
            ? { ...msg, sessionId: event.session_id, attachments: event.attachments }
            : msg,
        );
        return {
          ...state,
          sessionAgentMap: { ...state.sessionAgentMap, [event.session_id]: agent },
          sessions: {
            ...state.sessions,
            [agent]: { ...session, sessionId: event.session_id, status: "streaming", messages },
          },
        };
      });
      return;
    }
    case "agent_event": {
      const agent = get().sessionAgentMap[event.session_id];
    if (!agent) return;
      const record: AgentEventRecord = {
        id: makeId(),
        sessionId: event.session_id,
        at: nowIso(),
        payload: event.event,
      };
      set((state) => ({
        ...state,
        sessions: {
          ...state.sessions,
          [agent]: {
            ...state.sessions[agent],
            events: [...state.sessions[agent].events.slice(-99), record],
            status: "streaming",
          },
        },
      }));
      return;
    }
    case "agent_response": {
      const agent = get().sessionAgentMap[event.session_id];
      if (!agent) return;
      const agentMsg: AgentMessage = {
        id: makeId(),
        role: "agent",
        text: event.answer,
        at: nowIso(),
        sessionId: event.session_id,
      };
      set((state) => ({
        ...state,
        sessions: {
          ...state.sessions,
          [agent]: {
            ...state.sessions[agent],
            messages: [...state.sessions[agent].messages, agentMsg],
            plan: event.plan,
            toolResults: event.tool_results,
            llmStats: event.llm_stats,
            backendStats: event.llm_backend,
            status: "idle",
          },
        },
      }));
      return;
    }
    case "agent_error": {
      const agent = get().sessionAgentMap[event.session_id];
      if (!agent) return;
      set((state) => ({
        ...state,
        sessions: {
          ...state.sessions,
          [agent]: {
            ...state.sessions[agent],
            status: "error",
            lastError: event.message,
          },
        },
      }));
      return;
    }
    case "error":
      set((state) => ({
        ...state,
        sessions: {
          ...state.sessions,
          ...(state.currentAgent
            ? {
                [state.currentAgent]: {
                  ...state.sessions[state.currentAgent],
                  status: "error",
                  lastError: event.message,
                },
              }
            : {}),
  },
}));
      return;
    default:
      return;
  }
}

function resolveAgentForSession(
  sessionId: number,
  set: (fn: (state: UiState) => UiState) => void,
  get: () => UiState,
): AgentKey | undefined {
  const existing = get().sessionAgentMap[sessionId];
  if (existing) {
    return existing;
  }
  const queue = get().pendingAgentQueue;
  if (queue.length === 0) return undefined;
  const [agent, ...rest] = queue;
  set((state) => ({ ...state, pendingAgentQueue: rest }));
  return agent;
}
