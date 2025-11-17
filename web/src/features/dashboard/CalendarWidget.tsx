import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

export function CalendarWidget() {
  const today = new Date();
  const currentMonth = today.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayDate = today.getDate();

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
    <div onMouseMove={onMove} onMouseLeave={onLeave} className="rounded-2xl liquid-panel tilt p-4 min-h-[240px] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-pink-50/20 pointer-events-none rounded-2xl" />
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <Calendar className="size-5 text-slate-600" />
        <div className="text-slate-600 text-sm font-medium">{currentMonth}</div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2 relative z-10">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
          <div key={day} className="text-xs text-slate-500 text-center font-medium py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 relative z-10">
        {Array.from({ length: adjustedFirstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => (
          <div
            key={day}
            className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all cursor-pointer ${
              day === todayDate
                ? "bg-violet-500 text-white shadow-lg scale-110"
                : "text-slate-700 hover:bg-white/40 hover:scale-105"
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}

