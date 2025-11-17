import { motion } from "framer-motion";
import { BarChart3, ArrowUpRight } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { lightThemeOptions } from "../../styles/echarts-theme-light";

export function MonthlyReportWidget() {
  const currentMonth = new Date().toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  
  const monthlyData = Array.from({ length: 12 }).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      month: date.toLocaleDateString("ru-RU", { month: "short" }),
      value: Math.round(200000 + Math.random() * 300000),
    };
  });

  const currentValue = monthlyData[monthlyData.length - 1].value;
  const previousValue = monthlyData[monthlyData.length - 2].value;
  const change = previousValue ? ((currentValue - previousValue) / previousValue) * 100 : 0;

  const option = (() => {
    const lt = lightThemeOptions();
    return {
      ...lt,
      xAxis: {
        ...lt.xAxis,
        data: monthlyData.map((d) => d.month),
      },
      series: [
        {
          data: monthlyData.map((d) => d.value),
          type: "bar",
          barWidth: "60%",
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(139, 92, 246, 0.8)" },
                { offset: 1, color: "rgba(139, 92, 246, 0.2)" },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
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
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-purple-50/20 pointer-events-none rounded-2xl" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-slate-600" />
          <div className="text-slate-600 text-sm font-medium">Отчет по итогам месяца</div>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpRight className="size-4 text-green-500" />
          <span className="text-sm font-semibold text-green-600">+{change.toFixed(1)}%</span>
        </div>
      </div>
      <div className="mb-4 relative z-10">
        <div className="text-2xl font-bold text-slate-900 mb-1">
          {currentValue.toLocaleString("ru-RU")} ₽
        </div>
        <div className="text-xs text-slate-500">{currentMonth}</div>
      </div>
      <div className="relative z-10 rounded-xl overflow-hidden">
        <ReactECharts style={{ height: 200 }} option={option} />
      </div>
    </div>
  );
}

