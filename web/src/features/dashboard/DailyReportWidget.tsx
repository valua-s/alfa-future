import { motion } from "framer-motion";
import { FileText, TrendingUp, TrendingDown } from "lucide-react";

type DailyMetric = {
  label: string;
  value: string;
  change: number;
  positive: boolean;
};

export function DailyReportWidget() {
  const metrics: DailyMetric[] = [
    { label: "Доходы", value: "125 430 ₽", change: 12.5, positive: true },
    { label: "Расходы", value: "89 200 ₽", change: -5.2, positive: false },
    { label: "Операций", value: "47", change: 8.3, positive: true },
  ];

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
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-cyan-50/20 pointer-events-none rounded-2xl" />
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <FileText className="size-5 text-slate-600" />
        <div className="text-slate-600 text-sm font-medium">Отчет за день</div>
      </div>
      <div className="space-y-3 relative z-10">
        {metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center justify-between p-3 rounded-xl liquid-card border border-white/40 hover:bg-white/30 transition-all"
          >
            <div>
              <div className="text-xs text-slate-500 mb-1">{metric.label}</div>
              <div className="text-lg font-semibold text-slate-900">{metric.value}</div>
            </div>
            <div className="flex items-center gap-2">
              {metric.positive ? (
                <TrendingUp className="size-4 text-green-500" />
              ) : (
                <TrendingDown className="size-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${metric.positive ? "text-green-600" : "text-red-600"}`}>
                {metric.positive ? "+" : ""}
                {metric.change.toFixed(1)}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-auto pt-3 text-xs text-slate-500 relative z-10">
        Обновлено: {new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

