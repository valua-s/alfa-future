import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import { Search, Settings, Bell } from "lucide-react";
import { memo, useState } from "react";
import { motion } from "framer-motion";

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export const Header = memo(function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "1", title: "Новая задача", message: "Требуется проверка отчета за месяц", time: "5 мин назад", read: false },
    { id: "2", title: "Обновление интеграции", message: "Bitrix 24 обновлен до версии 2.0", time: "1 час назад", read: false },
    { id: "3", title: "Напоминание", message: "Не забудьте проверить баланс", time: "2 часа назад", read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const onSearchMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mx", x + "px");
    e.currentTarget.style.setProperty("--my", y + "px");
  };
  const onSearchLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.removeProperty("--mx");
    e.currentTarget.style.removeProperty("--my");
  };
  const onHeaderMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mx", x + "px");
    e.currentTarget.style.setProperty("--my", y + "px");
  };
  const onHeaderLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.removeProperty("--mx");
    e.currentTarget.style.removeProperty("--my");
  };
  const onSettingsMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mx", x + "px");
    e.currentTarget.style.setProperty("--my", y + "px");
  };
  const onSettingsLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.removeProperty("--mx");
    e.currentTarget.style.removeProperty("--my");
  };
  return (
    <header 
      onMouseMove={onHeaderMove}
      onMouseLeave={onHeaderLeave}
      className="sticky top-0 z-20 border-b liquid-panel backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-4">
        <Popover.Root>
          <Popover.Trigger asChild>
            <button 
              className="relative shrink-0 grid place-items-center h-10 w-10 rounded-xl liquid-card group transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(140px) saturate(180%) brightness(110%)',
                WebkitBackdropFilter: 'blur(140px) saturate(180%) brightness(110%)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(255,255,255,0.3), inset 0 0 120px rgba(255,255,255,0.1)',
                overflow: 'visible'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.35), inset 0 0 140px rgba(255,255,255,0.12)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(255,255,255,0.3), inset 0 0 120px rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
              }}
            >
              <Bell className="size-5 text-slate-700 group-hover:text-slate-900 transition-colors relative z-10" />
              {unreadCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center border-2 border-white shadow-lg z-[20]"
                  style={{ boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)' }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              sideOffset={8}
              align="start"
              className="min-w-[320px] max-w-[400px] max-h-[500px] rounded-2xl liquid-panel p-4 shadow-2xl border backdrop-blur-xl overflow-auto"
              style={{ zIndex: 1000 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Уведомления</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-slate-600 bg-white/40 px-2 py-1 rounded-full">
                    {unreadCount} новых
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">Нет уведомлений</div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => markAsRead(notification.id)}
                      className={`rounded-xl liquid-card p-3 cursor-pointer transition-all duration-200 hover:bg-white/40 border border-white/40 ${
                        !notification.read ? "bg-white/20" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 text-sm mb-1">{notification.title}</div>
                          <div className="text-xs text-slate-600 mb-2">{notification.message}</div>
                          <div className="text-xs text-slate-400">{notification.time}</div>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <a
          href="#/settings"
          aria-label="Настройки"
          onMouseMove={(e) => {
            onSettingsMove(e);
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.35), inset 0 0 140px rgba(255,255,255,0.12)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)';
          }}
          onMouseLeave={(e) => {
            onSettingsLeave(e);
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(255,255,255,0.3), inset 0 0 120px rgba(255,255,255,0.1)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
          }}
          className="shrink-0 grid place-items-center h-10 w-10 rounded-xl liquid-card group transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(140px) saturate(180%) brightness(110%)',
            WebkitBackdropFilter: 'blur(140px) saturate(180%) brightness(110%)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(255,255,255,0.3), inset 0 0 120px rgba(255,255,255,0.1)',
            overflow: 'visible'
          }}
          title="Настройки"
        >
          <Settings className="size-5 text-slate-700 transition-all group-hover:text-slate-900 group-hover:rotate-90 duration-300 relative z-10" />
        </a>
        <div onMouseMove={onSearchMove} onMouseLeave={onSearchLeave} className="relative w-full liquid-card rounded-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none transition-colors group-hover:text-slate-600" />
          <input
            id="global-search"
            aria-label="Поиск"
            placeholder="Поиск"
            className="w-full rounded-2xl bg-transparent pl-10 pr-3 py-3 text-base outline-none ring-0 liquid-input"
          />
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="ml-2 shrink-0 h-9 w-9 rounded-full bg-gradient-to-tr from-fuchsia-500 to-orange-400 text-white font-bold transition-all hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/30">A</button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content 
              sideOffset={8} 
              className="min-w-[200px] rounded-xl liquid-panel p-2 shadow-2xl border backdrop-blur-xl"
              style={{ zIndex: 1000 }}
            >
            <div className="px-2 py-1 text-xs text-slate-500 mb-1">ООО Альфа — ИНН 123456789</div>
            <DropdownMenu.Item className="px-3 py-2 rounded-lg text-sm hover:bg-white/40 cursor-pointer transition-all outline-none data-[highlighted]:bg-white/50">
              Профиль
            </DropdownMenu.Item>
            <DropdownMenu.Item className="px-3 py-2 rounded-lg text-sm hover:bg-white/40 cursor-pointer transition-all outline-none data-[highlighted]:bg-white/50">
              Выйти
            </DropdownMenu.Item>
          </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
});


