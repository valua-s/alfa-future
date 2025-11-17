import * as Tabs from "@radix-ui/react-tabs";
import { useMemo } from "react";
import { useIssues } from "./api";
import { motion, AnimatePresence } from "framer-motion";

export function IssuesPanel() {
  const { data, isLoading } = useIssues();
  const grouped = useMemo(() => {
    const items = data ?? [];
    return {
      all: items,
      open: items.filter((i) => i.status === "open"),
      resolved: items.filter((i) => i.status === "resolved"),
    };
  }, [data]);

  const badge = (status: "open" | "resolved") =>
    status === "open" ? "pill pill--danger" : "pill pill--success";

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
    <div onMouseMove={onMove} onMouseLeave={onLeave} className="rounded-2xl liquid-panel tilt p-4 min-h-[240px] flex flex-col">
      <div className="text-slate-600 text-sm mb-3 font-medium">Проблемы, выявленные ИИ агентом</div>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 w-2/3 bg-slate-200/40 rounded animate-pulse backdrop-blur-sm" />
          <div className="h-4 w-1/2 bg-slate-200/40 rounded animate-pulse backdrop-blur-sm" />
          <div className="h-4 w-3/4 bg-slate-200/40 rounded animate-pulse backdrop-blur-sm" />
        </div>
      ) : (
        <Tabs.Root defaultValue="all">
          <Tabs.List className="flex gap-2 mb-3">
            {[
              { id: "all", label: `Все (${grouped.all.length})` },
              { id: "open", label: `Открытые (${grouped.open.length})` },
              { id: "resolved", label: `Решенные (${grouped.resolved.length})` },
            ].map((t) => (
              <Tabs.Trigger
                key={t.id}
                value={t.id}
                className="px-3 py-1.5 rounded-lg text-sm liquid-card backdrop-blur-md data-[state=active]:bg-white/60 data-[state=active]:shadow-md transition-all duration-200 border border-white/30 hover:border-white/50"
              >
                {t.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {Object.entries(grouped).map(([key, items]) => (
            <Tabs.Content key={key} value={key}>
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {items.map((i) => (
                    <motion.li
                      key={i.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center justify-between rounded-xl liquid-card backdrop-blur-sm p-3 hover:bg-white/40 hover:shadow-md transition-all duration-200 border border-white/20 group"
                    >
                      <div className="text-sm pr-3 text-slate-700 group-hover:text-slate-900 transition-colors">{i.title}</div>
                      <span className={`${badge(i.status)} capitalize backdrop-blur-sm`}>
                        {i.status}
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              {items.length === 0 && <div className="text-sm text-slate-500 mt-2">Нет элементов</div>}
            </Tabs.Content>
          ))}
        </Tabs.Root>
      )}
    </div>
  );
}


