import { motion } from "framer-motion";
import { ReactNode, useCallback, useEffect, useRef } from "react";
import { useUi } from "../../store/ui";

export function FeatureCard({ title, icon }: { title: string; icon: ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const target = useRef({ x: -100, y: -100, rx: 0, ry: 0 });
  const current = useRef({ x: -100, y: -100, rx: 0, ry: 0 });
  const raf = useRef<number | null>(null);
  const { openAgentChat } = useUi();

  const animateVars = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    current.current.x += (target.current.x - current.current.x) * 0.22;
    current.current.y += (target.current.y - current.current.y) * 0.22;
    current.current.rx += (target.current.rx - current.current.rx) * 0.18;
    current.current.ry += (target.current.ry - current.current.ry) * 0.18;
    el.style.setProperty("--mx", `${current.current.x}px`);
    el.style.setProperty("--my", `${current.current.y}px`);
    el.style.setProperty("--rx", `${current.current.rx}deg`);
    el.style.setProperty("--ry", `${current.current.ry}deg`);
    raf.current = requestAnimationFrame(animateVars);
  }, []);

  useEffect(() => {
    raf.current = requestAnimationFrame(animateVars);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [animateVars]);

  const onMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x - rect.width / 2) / (rect.width / 2);
    const py = (y - rect.height / 2) / (rect.height / 2);
    target.current = {
      x,
      y,
      ry: px * 8,
      rx: -py * 8,
    };
  }, []);

  const onLeave = useCallback(() => {
    target.current = { x: -100, y: -100, rx: 0, ry: 0 };
  }, []);

  const onClick = () => {
    const map: Record<string, "financier" | "lawyer" | "marketer" | "accountant"> = {
      Финансист: "financier",
      Юрист: "lawyer",
      Маркетолог: "marketer",
      Бухгалтер: "accountant",
    };
    const key = map[title];
    if (key) openAgentChat(key);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group w-full rounded-2xl p-6 text-left flex items-center gap-4 relative overflow-hidden liquid-card tilt cursor-pointer"
    >
      <div className="h-12 w-12 rounded-xl liquid-card backdrop-blur-md grid place-items-center text-slate-700 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-white/30 shadow-md group-hover:shadow-lg">
        <div className="transition-transform duration-300 group-hover:scale-110">
        {icon}
        </div>
      </div>
      <div className="font-medium text-slate-800 group-hover:text-slate-900 transition-colors duration-200 relative z-10">{title}</div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-blue-100/0 group-hover:from-white/20 group-hover:via-blue-50/30 group-hover:to-transparent transition-all duration-300 rounded-2xl pointer-events-none" />
    </motion.button>
  );
}


