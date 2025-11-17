import { useEffect } from "react";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { FluidBackground } from "../effects/FluidBackground";
import { AgentChatOverlay } from "../../features/agent/AgentChat";
import { useTheme } from "../../store/theme";

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [147, 197, 253];
}

export function Shell({ children }: { children: ReactNode }) {
  const { getTheme } = useTheme();
  const theme = getTheme();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    
    document.body.style.background = `rgba(253, 254, 255)`;
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.transition = 'background 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    if (import.meta.env.DEV) {
      (async () => {
        const { makeServer } = await import("../../lib/mirage");
        if (!(window as any).__mirageServer) {
          (window as any).__mirageServer = makeServer();
        }
        if (import.meta.hot) {
          import.meta.hot.dispose(() => {
            try {
              (window as any).__mirageServer?.shutdown?.();
            } catch {}
            (window as any).__mirageServer = undefined;
          });
        }
      })();
    }
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.getElementById("global-search") as HTMLInputElement | null;
        el?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [theme.id]);

  return (
    <div className="min-h-full text-slate-900 light-bg relative">
      <FluidBackground />
      <div className="relative z-[1]">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-6 animate-[fadein_.25s_ease]">{children}</main>
      </div>
      <AgentChatOverlay />
    </div>
  );
}


