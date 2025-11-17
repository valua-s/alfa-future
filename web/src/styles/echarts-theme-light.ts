export function lightThemeOptions() {
  const gridColor = "rgba(2, 6, 23, 0.12)";
  const axisText = "#64748b";
  const axisLine = "#94a3b8";
  const accent = "rgb(37,99,235)";
  const areaTop = "rgba(37,99,235,0.25)";
  const areaBottom = "rgba(37,99,235,0.00)";
  return {
    grid: { left: 28, right: 8, top: 20, bottom: 20 },
    xAxis: {
      type: "category" as const,
      axisLabel: { color: axisText },
      axisLine: { lineStyle: { color: axisLine, opacity: 0.8 } },
      axisTick: { lineStyle: { color: axisLine, opacity: 0.4 } },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { color: axisText },
      splitLine: { lineStyle: { color: gridColor } },
    },
    seriesDefaults: {
      lineStyle: { color: accent },
      areaStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: areaTop },
            { offset: 1, color: areaBottom },
          ],
        },
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255,255,255,0.85)",
      borderColor: "rgba(2,6,23,0.08)",
      textStyle: { color: "#0f172a" },
      axisPointer: { lineStyle: { color: accent, width: 1.2 } },
    },
  };
}


