import { Briefcase, FileText, Scale, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FeatureCard } from "./FeatureCard";
import { RevenueWidget } from "./RevenueWidget";
import { IssuesPanel } from "./IssuesPanel";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { AgentReport } from "./AgentReport";
import { CalendarWidget } from "./CalendarWidget";
import { DailyReportWidget } from "./DailyReportWidget";
import { MonthlyReportWidget } from "./MonthlyReportWidget";
import { TaxWidget } from "./TaxWidget";
import { useSettings } from "../../store/settings";
import { DraggableWidget } from "./DraggableWidget";
import { useMemo, useState, useRef } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

type WidgetItem = {
  id: string;
  colSpan: number;
  component: React.ReactNode;
};

export function Dashboard() {
  const { displaySettings, widgetOrder, updateWidgetOrder, getWidgetOrder } = useSettings();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [temporaryOrder, setTemporaryOrder] = useState<typeof widgetOrder | null>(null);
  const [insertPosition, setInsertPosition] = useState<{ before?: string; after?: string } | null>(null);
  const widgetRefs = useRef<Map<string, HTMLElement>>(new Map());

  const allWidgets = useMemo(() => {
    const items: WidgetItem[] = [];

    if (displaySettings.calendar) {
      items.push({ id: "calendar", colSpan: 6, component: <CalendarWidget /> });
    }
    if (displaySettings.dailyReport) {
      items.push({ id: "dailyReport", colSpan: 6, component: <DailyReportWidget /> });
    }
    if (displaySettings.monthlyReport) {
      items.push({ id: "monthlyReport", colSpan: 12, component: <MonthlyReportWidget /> });
    }
    if (displaySettings.balance) {
      items.push({ id: "balance", colSpan: 6, component: <RevenueWidget /> });
    }
    if (displaySettings.tax) {
      items.push({ id: "tax", colSpan: 6, component: <TaxWidget /> });
    }
    if (displaySettings.problems) {
      items.push({ id: "problems", colSpan: 6, component: <IssuesPanel /> });
    }
    items.push({ id: "analytics", colSpan: 6, component: <AnalyticsPanel /> });
    items.push({ id: "agentReport", colSpan: 6, component: <AgentReport /> });

    return items;
  }, [displaySettings]);

  const widgets = useMemo(() => {
    const sorted = [...allWidgets].sort((a, b) => {
      const order = temporaryOrder || widgetOrder;
      const orderA = order.find((w) => w.id === a.id)?.order ?? 999;
      const orderB = order.find((w) => w.id === b.id)?.order ?? 999;
      return orderA - orderB;
    });
    return sorted;
  }, [allWidgets, widgetOrder, temporaryOrder]);

  const distributeWidgets = useMemo(() => {
    const fullWidth: typeof widgets = [];
    const leftColumn: typeof widgets = [];
    const rightColumn: typeof widgets = [];

    let leftHeight = 0;
    let rightHeight = 0;

    for (const widget of widgets) {
      if (widget.colSpan === 12) {
        fullWidth.push(widget);
      } else {
        const widgetHeight = getEstimatedHeight(widget.id);
        if (leftHeight <= rightHeight) {
          leftColumn.push(widget);
          leftHeight += widgetHeight;
        } else {
          rightColumn.push(widget);
          rightHeight += widgetHeight;
        }
      }
    }

    return { fullWidth, leftColumn, rightColumn };
  }, [widgets]);

  function getEstimatedHeight(widgetId: string): number {
    const heightMap: Record<string, number> = {
      calendar: 320,
      dailyReport: 280,
      monthlyReport: 300,
      balance: 200,
      tax: 200,
      problems: 400,
      analytics: 300,
      agentReport: 350,
    };
    return heightMap[widgetId] || 250;
  }

  const handleDragStart = (id: string, e: React.DragEvent) => {
    setDraggedId(id);
    setTemporaryOrder([...widgetOrder]);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragEnd = () => {
    if (temporaryOrder) {
      const reordered = temporaryOrder.map((w, idx) => ({ ...w, order: idx }));
      updateWidgetOrder(reordered);
    }
    setDraggedId(null);
    setDragOverId(null);
    setTemporaryOrder(null);
    setInsertPosition(null);
  };

  const handleDragOver = (targetId: string, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId || !temporaryOrder) return;

    const targetEl = widgetRefs.current.get(targetId);
    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();
    const mouseY = e.clientY;
    const centerY = rect.top + rect.height / 2;

    const currentOrder = [...temporaryOrder];
    const sourceIndex = currentOrder.findIndex((w) => w.id === draggedId);
    const targetIndex = currentOrder.findIndex((w) => w.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const allWidgetElements = Array.from(widgetRefs.current.values())
      .filter((el) => el && el.dataset.widgetId)
      .sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        const topDiff = rectA.top - rectB.top;
        if (Math.abs(topDiff) > 10) return topDiff;
        return rectA.left - rectB.left;
      })
      .map((el) => el.dataset.widgetId)
      .filter(Boolean) as string[];

    const targetPos = allWidgetElements.indexOf(targetId);
    const sourcePos = allWidgetElements.indexOf(draggedId);

    if (targetPos === -1 || sourcePos === -1) return;

    let newPos = targetPos;
    if (mouseY < centerY) {
      newPos = targetPos;
    } else {
      newPos = targetPos + 1;
    }

    if (sourcePos < newPos) {
      newPos -= 1;
    }

    if (newPos !== sourcePos && newPos >= 0 && newPos < allWidgetElements.length) {
      const newIdAtPos = allWidgetElements[newPos];
      const newIndexInOrder = currentOrder.findIndex((w) => w.id === newIdAtPos);

      if (newIndexInOrder !== sourceIndex && newIndexInOrder >= 0) {
        const removed = currentOrder.splice(sourceIndex, 1);
        const removedWidget = removed[0];
        if (removedWidget) {
          let insertIndex = newIndexInOrder;
          if (newIndexInOrder > sourceIndex) {
            insertIndex = newIndexInOrder - 1;
          }
          currentOrder.splice(insertIndex, 0, removedWidget);
          
          const reordered = currentOrder.map((w, idx) => ({ ...w, order: idx }));
          setTemporaryOrder(reordered);

          const nextWidget = currentOrder[insertIndex + 1];
          const prevWidget = currentOrder[insertIndex - 1];
          
          if (nextWidget) {
            setInsertPosition({ before: nextWidget.id });
          } else if (prevWidget) {
            setInsertPosition({ after: prevWidget.id });
          } else {
            setInsertPosition(null);
          }
        }
      }
    }

    setDragOverId(targetId);
  };

  const handleColumnDragOver = (column: "left" | "right", e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId || !temporaryOrder) return;

    const containerEl = e.currentTarget as HTMLElement;
    const containerRect = containerEl.getBoundingClientRect();
    const mouseY = e.clientY;
    const mouseX = e.clientX;

    const columnWidgets = Array.from(widgetRefs.current.entries())
      .filter(([id, el]) => {
        if (!el || !el.dataset.widgetId) return false;
        return el.dataset.column === column;
      })
      .map(([id]) => id);

    const columnElements = columnWidgets
      .map((id) => widgetRefs.current.get(id))
      .filter(Boolean) as HTMLElement[];

    if (columnElements.length === 0) {
      const currentOrder = [...temporaryOrder];
      const sourceIndex = currentOrder.findIndex((w) => w.id === draggedId);
      if (sourceIndex === -1) return;

      const removed = currentOrder.splice(sourceIndex, 1);
      const removedWidget = removed[0];
      if (removedWidget) {
        currentOrder.push(removedWidget);
        const reordered = currentOrder.map((w, idx) => ({ ...w, order: idx }));
        setTemporaryOrder(reordered);
        setInsertPosition(null);
      }
      return;
    }

    const sortedColumnElements = columnElements.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return rectA.top - rectB.top;
    }).filter((el): el is HTMLElement => el !== null && el !== undefined);

    if (sortedColumnElements.length === 0) return;

    let targetWidget: HTMLElement | null = null;
    let insertAfter = false;

    for (let i = 0; i < sortedColumnElements.length; i++) {
      const el = sortedColumnElements[i];
      if (!el) continue;
      
      const rect = el.getBoundingClientRect();
      
      if (mouseY < rect.top + rect.height / 2) {
        targetWidget = el;
        insertAfter = false;
        break;
      } else {
        const nextEl = sortedColumnElements[i + 1];
        if (!nextEl || mouseY < nextEl.getBoundingClientRect().top) {
          targetWidget = el;
          insertAfter = true;
          break;
        }
      }
    }

    if (!targetWidget) {
      const lastEl = sortedColumnElements[sortedColumnElements.length - 1];
      if (lastEl) {
        targetWidget = lastEl;
        insertAfter = true;
      }
    }

    if (!targetWidget) return;

    const targetId = targetWidget.dataset.widgetId;
    if (!targetId || targetId === draggedId) return;

    const currentOrder = [...temporaryOrder];
    const sourceIndex = currentOrder.findIndex((w) => w.id === draggedId);
    const targetIndex = currentOrder.findIndex((w) => w.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    let insertIndex = targetIndex;
    if (insertAfter) {
      insertIndex = targetIndex + 1;
    }

    if (sourceIndex < insertIndex) {
      insertIndex -= 1;
    }

    if (insertIndex !== sourceIndex) {
      const removed = currentOrder.splice(sourceIndex, 1);
      const removedWidget = removed[0];
      if (removedWidget) {
        currentOrder.splice(insertIndex, 0, removedWidget);
        
        const reordered = currentOrder.map((w, idx) => ({ ...w, order: idx }));
        setTemporaryOrder(reordered);

        if (insertAfter) {
          setInsertPosition({ after: targetId });
        } else {
          setInsertPosition({ before: targetId });
        }
      }
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
    setInsertPosition(null);
  };

  const handleDrop = (targetId: string, e: React.DragEvent) => {
    e.preventDefault();
    handleDragEnd();
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants} className="text-xl sm:text-2xl font-semibold text-slate-900">
        Выбери ИИ агента
      </motion.h1>

      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
        <FeatureCard title="Финансист" icon={<Wallet className="size-6" />} />
        </motion.div>
        <motion.div variants={itemVariants}>
        <FeatureCard title="Юрист" icon={<Scale className="size-6" />} />
        </motion.div>
        <motion.div variants={itemVariants}>
        <FeatureCard title="Маркетолог" icon={<Briefcase className="size-6" />} />
        </motion.div>
        <motion.div variants={itemVariants}>
        <FeatureCard title="Бухгалтер" icon={<FileText className="size-6" />} />
        </motion.div>
      </motion.div>

      {distributeWidgets.fullWidth.length > 0 && (
        <motion.div variants={containerVariants} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {distributeWidgets.fullWidth.map((widget) => {
              const isDragging = draggedId === widget.id;
              const showInsertBefore = insertPosition?.before === widget.id;
              const showInsertAfter = insertPosition?.after === widget.id;

              return (
                <motion.div
                  key={widget.id}
                  data-widget-id={widget.id}
                  layout
                  initial={false}
                  variants={itemVariants}
                  animate={{
                    opacity: isDragging ? 0.5 : 1,
                    scale: isDragging ? 0.95 : 1,
                  }}
                  transition={{
                    layout: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
                  }}
                  ref={(el) => {
                    if (el) widgetRefs.current.set(widget.id, el);
                  }}
                  onDrop={(e) => handleDrop(widget.id, e)}
                  onDragOver={(e) => handleDragOver(widget.id, e)}
                  onDragLeave={handleDragLeave}
                  className="relative"
                >
                  {showInsertBefore && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0 }}
                      className="absolute -top-1 left-0 right-0 h-0.5 bg-violet-500 rounded-full z-30 shadow-lg"
                    />
                  )}
                  <DraggableWidget
                    id={widget.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={isDragging}
                  >
                    {widget.component}
                  </DraggableWidget>
                  {showInsertAfter && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0 }}
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-violet-500 rounded-full z-30 shadow-lg"
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <motion.div
        variants={containerVariants}
        className="flex gap-x-1"
        onDragOver={(e) => e.preventDefault()}
      >
        <div 
          className="flex-1 flex flex-col gap-y-4"
          onDragOver={(e) => handleColumnDragOver("left", e)}
          onDrop={(e) => {
            e.preventDefault();
            handleDragEnd();
          }}
        >
          <AnimatePresence mode="popLayout">
            {distributeWidgets.leftColumn.map((widget) => {
              const isDragging = draggedId === widget.id;
              const showInsertBefore = insertPosition?.before === widget.id;
              const showInsertAfter = insertPosition?.after === widget.id;

              return (
                <motion.div
                  key={widget.id}
                  data-widget-id={widget.id}
                  data-column="left"
                  layout
                  initial={false}
                  variants={itemVariants}
                  animate={{
                    opacity: isDragging ? 0.5 : 1,
                    scale: isDragging ? 0.95 : 1,
                  }}
                  transition={{
                    layout: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
                  }}
                  ref={(el) => {
                    if (el) widgetRefs.current.set(widget.id, el);
                  }}
                  onDrop={(e) => handleDrop(widget.id, e)}
                  onDragOver={(e) => handleDragOver(widget.id, e)}
                  onDragLeave={handleDragLeave}
                  className="relative"
                >
                  {showInsertBefore && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0 }}
                      className="absolute -top-1 left-0 right-0 h-0.5 bg-violet-500 rounded-full z-30 shadow-lg"
                    />
                  )}
                  <DraggableWidget
                    id={widget.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={isDragging}
                  >
                    {widget.component}
                  </DraggableWidget>
                  {showInsertAfter && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0 }}
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-violet-500 rounded-full z-30 shadow-lg"
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div 
          className="flex-1 flex flex-col gap-y-4"
          onDragOver={(e) => handleColumnDragOver("right", e)}
          onDrop={(e) => {
            e.preventDefault();
            handleDragEnd();
          }}
        >
          <AnimatePresence mode="popLayout">
            {distributeWidgets.rightColumn.map((widget) => {
              const isDragging = draggedId === widget.id;
              const showInsertBefore = insertPosition?.before === widget.id;
              const showInsertAfter = insertPosition?.after === widget.id;

              return (
                <motion.div
                  key={widget.id}
                  data-widget-id={widget.id}
                  data-column="right"
                  layout
                  initial={false}
                  variants={itemVariants}
                  animate={{
                    opacity: isDragging ? 0.5 : 1,
                    scale: isDragging ? 0.95 : 1,
                  }}
                  transition={{
                    layout: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
                  }}
                  ref={(el) => {
                    if (el) widgetRefs.current.set(widget.id, el);
                  }}
                  onDrop={(e) => handleDrop(widget.id, e)}
                  onDragOver={(e) => handleDragOver(widget.id, e)}
                  onDragLeave={handleDragLeave}
                  className="relative"
                >
                  {showInsertBefore && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0 }}
                      className="absolute -top-1 left-0 right-0 h-0.5 bg-violet-500 rounded-full z-30 shadow-lg"
                    />
                  )}
                  <DraggableWidget
                    id={widget.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={isDragging}
                  >
                    {widget.component}
                  </DraggableWidget>
                  {showInsertAfter && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0 }}
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-violet-500 rounded-full z-30 shadow-lg"
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}


