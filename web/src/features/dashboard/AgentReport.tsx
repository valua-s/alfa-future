import { useAgentReport } from "./api";
import { formatDateShort } from "../../lib/format";
import { motion, AnimatePresence } from "framer-motion";

export function AgentReport() {
  const { data, isLoading } = useAgentReport();

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mx", x + "px");
    e.currentTarget.style.setProperty("--my", y + "px");
    const px = (x - rect.width / 2) / (rect.width / 2);
    const py = (y - rect.height / 2) / (rect.height / 2);
    e.currentTarget.style.setProperty("--ry", px * 4 + "deg");
    e.currentTarget.style.setProperty("--rx", py * -4 + "deg");
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.removeProperty("--mx");
    e.currentTarget.style.removeProperty("--my");
    e.currentTarget.style.removeProperty("--rx");
    e.currentTarget.style.removeProperty("--ry");
  };
  return (
    <div onMouseMove={onMove} onMouseLeave={onLeave} className="rounded-2xl liquid-panel tilt p-4 min-h-[240px] relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 via-transparent to-purple-50/20 pointer-events-none rounded-2xl" />
      <div className="text-slate-600 text-sm mb-3 font-medium relative z-10">Отчет о работе ИИ агента</div>
      {isLoading ? (
        <div className="space-y-2 relative z-10">
          <div className="h-4 w-3/4 liquid-card backdrop-blur-sm rounded animate-pulse border border-white/20" />
          <div className="h-4 w-2/3 liquid-card backdrop-blur-sm rounded animate-pulse border border-white/20" />
          <div className="h-4 w-1/2 liquid-card backdrop-blur-sm rounded animate-pulse border border-white/20" />
        </div>
      ) : (
        <ul className="space-y-2 relative z-10">
          <AnimatePresence initial={false}>
            {data?.map((i) => (
              <motion.li
                key={i.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="grid grid-cols-[16px_56px_1fr] items-center gap-3 rounded-lg p-2 hover:bg-white/30 transition-all duration-200 group"
              >
                <div className="relative h-3 w-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-violet-500 shadow-[0_0_0_3px_rgba(99,102,241,0.15)] group-hover:shadow-[0_0_0_4px_rgba(99,102,241,0.25)] transition-all duration-200" />
                </div>
                <div className="text-[11px] leading-none text-slate-500 tabular-nums group-hover:text-slate-600 transition-colors">{formatDateShort(i.time)}</div>
                <div className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">{i.text}</div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}


