import ReactECharts from "echarts-for-react";
import { useAnalytics } from "./api";
import { useMemo } from "react";
import { formatDateShort } from "../../lib/format";
import { lightThemeOptions } from "../../styles/echarts-theme-light";

export function AnalyticsPanel() {
  const { data, isLoading } = useAnalytics();

  const option = useMemo(() => {
    const points = data ?? [];
    const isDark = document.documentElement.classList.contains("dark");
    const base = isDark
      ? {
          grid: { left: 28, right: 8, top: 20, bottom: 20 },
          xAxis: {
            type: "category",
            data: points.map((p) => formatDateShort(p.date)),
            axisLabel: { color: "#94a3b8" },
            axisLine: { lineStyle: { color: "#334155" } },
          },
          yAxis: {
            type: "value",
            axisLabel: { color: "#94a3b8" },
            splitLine: { lineStyle: { color: "#334155", opacity: 0.2 } },
          },
          tooltip: { trigger: "axis" },
        }
      : (() => {
          const lt = lightThemeOptions();
          return {
            grid: lt.grid,
            xAxis: { ...lt.xAxis, data: points.map((p) => formatDateShort(p.date)) },
            yAxis: lt.yAxis,
            tooltip: lt.tooltip,
          };
        })();
    const seriesDefaults = !isDark ? lightThemeOptions().seriesDefaults : { lineStyle: { color: "rgb(99,102,241)" } };
    const hasAreaStyle = "areaStyle" in seriesDefaults && seriesDefaults.areaStyle;
    return {
      ...base,
      series: [
        {
          data: points.map((p) => p.value),
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: seriesDefaults.lineStyle,
          ...(hasAreaStyle && { areaStyle: seriesDefaults.areaStyle }),
        },
      ],
    };
  }, [data]);

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
      <div className="text-slate-600 text-sm mb-3 font-medium relative z-10">Аналитика или статистика</div>
      {isLoading ? (
        <div className="h-48 rounded liquid-card backdrop-blur-sm animate-pulse border border-white/20" />
      ) : (
        <div className="relative z-10 rounded-xl overflow-hidden">
          <ReactECharts style={{ height: 210 }} option={option} />
        </div>
      )}
    </div>
  );
}


