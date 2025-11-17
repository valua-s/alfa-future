import { motion, useSpring, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";
import { useSummary } from "./api";
import { formatCurrencyRub } from "../../lib/format";
import { useAnalytics } from "./api";
import ReactECharts from "echarts-for-react";
import { lightThemeOptions } from "../../styles/echarts-theme-light";

export function RevenueWidget() {
  const { data, isLoading } = useSummary();
  const analytics = useAnalytics();
  const value = useMotionValue(0);
  const spring = useSpring(value, { stiffness: 120, damping: 20 });
  const [display, setDisplay] = useState("0,00 ₽");

  useEffect(() => {
    if (data) value.set(data.total);
  }, [data, value]);

  useMotionValueEvent(spring, "change", (v) => {
    setDisplay(formatCurrencyRub(Number(v)));
  });

  const changePct = (() => {
    const arr = analytics.data ?? [];
    if (arr.length < 2) return 0;
    const first = arr[0]?.value;
    const last = arr[arr.length - 1]?.value;
    if (!first || last === undefined) return 0;
    return ((last - first) / first) * 100;
  })();
  const changePositive = changePct >= 0;

  const miniOption = (() => {
    const isDark = document.documentElement.classList.contains("dark");
    const accent = changePositive ? "rgb(34,197,94)" : "rgb(239,68,68)";
    if (isDark) {
      return {
        grid: { left: 0, right: 0, top: 0, bottom: 0 },
        xAxis: { type: "category", show: false, data: (analytics.data ?? []).map((p) => p.date) },
        yAxis: { type: "value", show: false },
        series: [
          {
            data: (analytics.data ?? []).map((p) => p.value),
            type: "line",
            smooth: true,
            showSymbol: false,
            lineStyle: { color: accent },
            areaStyle: { opacity: 0.08, color: accent },
          },
        ],
        tooltip: { show: false },
      };
    } else {
      const lt = lightThemeOptions();
      return {
        grid: { left: 0, right: 0, top: 0, bottom: 0 },
        xAxis: { type: "category", show: false, data: (analytics.data ?? []).map((p) => p.date) },
        yAxis: { type: "value", show: false },
        series: [
          {
            data: (analytics.data ?? []).map((p) => p.value),
            type: "line",
            smooth: true,
            showSymbol: false,
            lineStyle: { color: accent },
            areaStyle: { opacity: 0.12, color: accent },
          },
        ],
        tooltip: { show: false },
      };
    }
  })();

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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-50/40 via-blue-50/20 to-cyan-50/30 rounded-2xl" />
      <div className="text-slate-600 text-sm mb-3 font-medium relative z-10">Баланс</div>
      {isLoading ? (
        <div className="h-10 w-48 liquid-card backdrop-blur-sm rounded animate-pulse border border-white/20" />
      ) : (
        <div className="flex items-start justify-between gap-4 relative z-10">
          <motion.div className="text-3xl font-semibold tracking-tight tabular-nums text-slate-900">{display}</motion.div>
          <div className="flex flex-col items-end gap-2">
            <span className={`pill ${changePositive ? "pill--success" : "pill--danger"} backdrop-blur-sm shadow-sm`}>
              {changePositive ? "▲" : "▼"} {Math.abs(changePct).toFixed(1)}%
            </span>
            <div className="w-32 h-14 rounded-lg liquid-card backdrop-blur-sm border border-white/20 p-1">
              <ReactECharts style={{ height: 56 }} option={miniOption} />
            </div>
          </div>
        </div>
      )}
      <div className="mt-auto pt-3 text-xs text-slate-500 relative z-10">Обновлено: {new Date().toLocaleDateString("ru-RU")}</div>
    </div>
  );
}


