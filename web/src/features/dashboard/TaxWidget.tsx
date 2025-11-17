import { motion } from "framer-motion";
import { Receipt, AlertCircle } from "lucide-react";

export function TaxWidget() {
  const taxAmount = 145680;
  const taxRate = 20;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);
  const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

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
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-transparent to-red-50/20 pointer-events-none rounded-2xl" />
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <Receipt className="size-5 text-slate-600" />
        <div className="text-slate-600 text-sm font-medium">Сумма налога</div>
      </div>
      <div className="mb-4 relative z-10">
        <div className="text-3xl font-bold text-slate-900 mb-2">
          {taxAmount.toLocaleString("ru-RU")} ₽
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-orange-100/60 text-orange-700 text-xs font-medium backdrop-blur-sm">
            Ставка {taxRate}%
          </div>
        </div>
      </div>
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between p-3 rounded-xl liquid-card border border-white/40">
          <div className="text-sm text-slate-600">Срок уплаты</div>
          <div className="text-sm font-semibold text-slate-900">
            {dueDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
          </div>
        </div>
        {daysUntilDue <= 7 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-50/60 border border-red-200/40 backdrop-blur-sm"
          >
            <AlertCircle className="size-4 text-red-600" />
            <div className="text-sm font-medium text-red-700">
              Осталось {daysUntilDue} {daysUntilDue === 1 ? "день" : daysUntilDue < 5 ? "дня" : "дней"}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

