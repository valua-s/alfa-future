import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Paperclip, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AgentAttachmentReference } from "../../lib/agentWebSocket";
import { useUi } from "../../store/ui";

const agentTitle = {
  financier: "ИИ Финансист",
  lawyer: "ИИ Юрист",
  marketer: "ИИ Маркетолог",
  accountant: "ИИ Бухгалтер",
} as const;

const statusLabel: Record<string, { text: string; color: string }> = {
  open: { text: "Онлайн", color: "bg-emerald-400" },
  connecting: { text: "Подключение…", color: "bg-amber-400" },
  closed: { text: "Закрыто", color: "bg-slate-400" },
  error: { text: "Ошибка", color: "bg-rose-400" },
  idle: { text: "Отключено", color: "bg-slate-400" },
};

export function AgentChatOverlay() {
  const { agentChatOpen, closeAgentChat } = useUi();
  if (!agentChatOpen) return null;
  return <AgentChat onClose={closeAgentChat} />;
}

export function AgentChat({ onClose }: { onClose: () => void }) {
  const {
    currentAgent,
    sessions,
    pendingAttachments,
    sendMessage,
    uploadFiles,
    removeAttachment,
    connectionStatus,
    connect,
  } = useUi();

  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    const token = localStorage.getItem("auth_token");
    if (token) {
      connect(token);
      initializedRef.current = true;
    }
  }, [connect]);

  const session = currentAgent ? sessions[currentAgent] : null;
  const attachments = currentAgent ? pendingAttachments[currentAgent] ?? [] : [];
  const title = currentAgent ? agentTitle[currentAgent] : "ИИ Агент";
  const isBusy = session?.status === "pending" || session?.status === "streaming";
  const badge = statusLabel[connectionStatus] ?? statusLabel.idle;

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session?.messages.length]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentAgent || (!text.trim() && attachments.length === 0)) return;
    sendMessage(currentAgent, text);
    setText("");
  };

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentAgent || !event.target.files?.length) return;
    setUploadError(null);
    setUploading(true);
    try {
      await uploadFiles(currentAgent, Array.from(event.target.files));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Не удалось загрузить файлы");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const timeline = useMemo(
    () => (session?.events ?? []).slice(-8).reverse(),
    [session?.events],
  );
  const plan = session?.plan ?? [];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed inset-0 z-50 p-2 md:p-4"
        style={{
          background: "rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.94, y: 20, filter: "blur(8px)" }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1], filter: { duration: 0.3 } }}
          className="mx-auto max-w-[1600px] h-full rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-3"
          onClick={(event) => event.stopPropagation()}
        >
          <aside className="hidden lg:flex lg:flex-col lg:col-span-5 liquid-panel rounded-2xl p-4 overflow-hidden">
            <SectionTitle>Живой прогресс</SectionTitle>
            <div className="flex-1 overflow-auto space-y-3 pr-1">
              {timeline.length === 0 && (
                <p className="text-sm text-slate-500">Нет активных событий — начните диалог.</p>
              )}
              {timeline.map((row) => (
                <div key={row.id} className="rounded-2xl liquid-card p-3">
                  <div className="text-xs text-slate-500">{new Date(row.at).toLocaleTimeString()}</div>
                  <pre className="text-[13px] mt-1 text-slate-800 whitespace-pre-wrap">
                    {JSON.stringify(row.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
            {plan.length > 0 && (
              <div className="mt-4">
                <SectionTitle>План выполнения</SectionTitle>
                <div className="space-y-2 max-h-56 overflow-auto pr-1">
                  {plan.map((step: any, idx: number) => (
                    <div key={`${step.step}-${idx}`} className="liquid-card rounded-2xl p-3 text-sm">
                      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                        Шаг {step.step ?? idx + 1}
                      </div>
                      <div className="font-medium text-slate-800">{step.action}</div>
                      <div className="text-xs text-slate-500 mt-1">{step.tool}</div>
                    </div>
              ))}
            </div>
          </div>
            )}
          </aside>

          <section className="lg:col-span-7 liquid-panel rounded-2xl flex flex-col relative overflow-hidden">
            <header className="flex items-center justify-between gap-3 p-4 border-b border-white/30">
              <div>
              <div className="font-medium text-slate-900">{title}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className={`h-2 w-2 rounded-full ${badge.color}`} />
                  {badge.text}
                  {isBusy && (
                    <span className="inline-flex items-center gap-1 text-violet-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Генерация ответа…
                    </span>
                  )}
                </div>
              </div>
              <button
                className="h-9 w-9 grid place-items-center rounded-xl liquid-card hover:scale-110 active:scale-95 transition-all duration-200"
                onClick={onClose}
              >
                <X className="size-4 text-slate-700" />
              </button>
            </header>

            <div ref={messagesRef} className="flex-1 overflow-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {(session?.messages ?? []).map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className={message.role === "user" ? "text-right" : ""}
                  >
                    <div
                      className={`inline-block max-w-[85%] px-4 py-2.5 rounded-2xl ${
                        message.role === "user"
                          ? "liquid-card border border-violet-300/40 text-slate-800 shadow-md"
                          : "liquid-card border border-white/40 text-slate-800"
                      }`}
                    >
                      <p>{message.text}</p>
                      {message.attachments?.length ? (
                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          {message.attachments.map((file) => (
                            <div key={file.id} className="flex items-center gap-2">
                              <Paperclip className="h-3.5 w-3.5" />
                              <span className="truncate">{file.filename}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {session?.lastError && (
              <div className="px-4 pb-2">
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-700">
                  {session.lastError}
                </div>
              </div>
            )}

            {currentAgent && (
              <div className="px-4 pb-2 space-y-2">
                <AttachmentList
                  attachments={attachments}
                  onRemove={(id) => removeAttachment(currentAgent, id)}
                />
                {uploadError && <p className="text-xs text-rose-500">{uploadError}</p>}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-3 border-t border-white/30 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 liquid-card cursor-pointer text-sm">
                  <Paperclip className="h-4 w-4" />
                  <span>{uploading ? "Загрузка…" : "Прикрепить файлы"}</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFiles}
                    accept=".pdf,.docx,.xlsx,.csv,.txt"
                  />
                </label>
              </div>
              <div className="flex gap-2">
              <input
                value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Опишите задачу для агента"
                className="flex-1 liquid-input rounded-2xl px-4 py-3 outline-none ring-0"
                  disabled={!currentAgent}
              />
                <button
                  type="submit"
                  className="rounded-2xl px-5 py-3 liquid-btn-red font-medium disabled:opacity-60"
                  disabled={!currentAgent}
                >
                Отправить
              </button>
              </div>
            </form>
          </section>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-slate-600 mb-3 font-medium">{children}</div>;
}

function AttachmentList({
  attachments,
  onRemove,
}: {
  attachments: AgentAttachmentReference[];
  onRemove: (id: string) => void;
}) {
  if (!attachments.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-2 rounded-2xl border border-white/40 bg-white/40 px-3 py-2 text-xs text-slate-700"
        >
          <Paperclip className="h-3.5 w-3.5" />
          <span className="truncate max-w-[140px]">{file.filename}</span>
          <button onClick={() => onRemove(file.id)} className="text-slate-400 hover:text-rose-500">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
