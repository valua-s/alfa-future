import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { motion } from "framer-motion";

type DraggableWidgetProps = {
  id: string;
  children: ReactNode;
  onDragStart: (id: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
};

export function DraggableWidget({ id, children, onDragStart, onDragEnd, isDragging }: DraggableWidgetProps) {
  const [isHovering, setIsHovering] = useState(false);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart(id, e);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    
    const widgetElement = e.currentTarget.closest('[data-widget-id]') || e.currentTarget.parentElement?.parentElement;
    if (widgetElement instanceof HTMLElement) {
      const rect = widgetElement.getBoundingClientRect();
      const handleRect = e.currentTarget.getBoundingClientRect();
      const offsetX = handleRect.left - rect.left;
      const offsetY = handleRect.top - rect.top;
      
      const dragPreview = widgetElement.cloneNode(true) as HTMLElement;
      dragPreview.style.transform = "rotate(2deg) scale(0.95)";
      dragPreview.style.opacity = "0.9";
      dragPreview.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)";
      dragPreview.style.pointerEvents = "none";
      dragPreview.style.position = "absolute";
      dragPreview.style.top = "-1000px";
      dragPreview.style.width = `${rect.width}px`;
      dragPreview.style.height = `${rect.height}px`;
      document.body.appendChild(dragPreview);
      
      e.dataTransfer.setDragImage(dragPreview, offsetX + 20, offsetY + 20);
      
      setTimeout(() => {
        if (document.body.contains(dragPreview)) {
          document.body.removeChild(dragPreview);
        }
      }, 0);
    }
  };

  return (
    <motion.div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative group"
      animate={{
        scale: isDragging ? 0.95 : 1,
        opacity: isDragging ? 0.6 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      <div
        ref={dragHandleRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={(e) => onDragEnd()}
        className={`absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing p-1.5 rounded-lg transition-all duration-200 ${
          isHovering ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(140px) saturate(180%) brightness(110%)",
          WebkitBackdropFilter: "blur(140px) saturate(180%) brightness(110%)",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.35)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.18)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.9)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(255,255,255,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.12)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.35)";
        }}
      >
        <GripVertical className="size-4 text-slate-700" />
      </div>
      <div className="pointer-events-none" style={{ pointerEvents: "auto" }}>
        {children}
      </div>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          className="absolute inset-0 bg-violet-500 rounded-2xl pointer-events-none z-10"
        />
      )}
    </motion.div>
  );
}

