import { useState } from "react";
import { motion } from "framer-motion";
import * as Switch from "@radix-ui/react-switch";
import { MoreVertical, ArrowLeft, Plus, Check } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTheme } from "../../store/theme";
import { useSettings } from "../../store/settings";

type Integration = {
  id: string;
  name: string;
  logo?: string;
  connected: boolean;
};

type IntegrationCategory = {
  id: string;
  label: string;
  integrations: Integration[];
};

export function Settings() {
  const { themes, currentTheme, setTheme } = useTheme();
  const { displaySettings, toggleDisplaySetting } = useSettings();

  const displaySettingsList = [
    { id: "calendar" as const, label: "Календарь" },
    { id: "dailyReport" as const, label: "Отчет за день" },
    { id: "monthlyReport" as const, label: "Отчет по итогам месяца" },
    { id: "balance" as const, label: "Баланс на основной карте" },
    { id: "tax" as const, label: "Сумма налога" },
    { id: "problems" as const, label: "Выявленные проблемы" },
  ];

  const [integrations, setIntegrations] = useState<IntegrationCategory[]>([
    {
      id: "finance",
      label: "Финансы",
      integrations: [
        { id: "bitrix24-finance", name: "Bitrix 24", connected: true },
        { id: "1c-finance", name: "1C", connected: false },
        { id: "fsn-finance", name: "ФСН", connected: false },
      ],
    },
    {
      id: "lawyer",
      label: "Юрист",
      integrations: [
        { id: "bitrix24-lawyer", name: "Bitrix 24", connected: true },
        { id: "1c-lawyer", name: "1C", connected: false },
      ],
    },
    {
      id: "marketer",
      label: "Маркетолог",
      integrations: [
        { id: "yandex-delivery", name: "Я Доставка", connected: true, logo: "yandex" },
        { id: "rsya", name: "РСЯ", connected: false },
      ],
    },
    {
      id: "accountant",
      label: "Бухгалтер",
      integrations: [
        { id: "bitrix24-accountant", name: "Bitrix 24", connected: false },
        { id: "1c-accountant", name: "1C", connected: false },
      ],
    },
  ]);


  const toggleIntegration = (categoryId: string, integrationId: string) => {
    setIntegrations((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              integrations: cat.integrations.map((int) =>
                int.id === integrationId ? { ...int, connected: !int.connected } : int
              ),
            }
          : cat
      )
    );
  };

  const getLogo = (logo?: string) => {
    if (logo === "yandex") {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-600 rounded-xl p-4">
          <div className="text-white font-bold text-2xl mb-1">Я</div>
          <div className="text-white text-xs font-medium">Доставка</div>
        </div>
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center">
        <MoreVertical className="size-6 text-slate-400" />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a
            href="#/"
            className="h-10 w-10 grid place-items-center rounded-xl liquid-card group transition-transform hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="size-5 text-slate-700 group-hover:text-slate-900 transition-colors" />
          </a>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Настройки</h1>
        </div>
      </div>

      <div className="liquid-panel rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Отображение на Главной</h2>
        <div className="space-y-4">
          {displaySettingsList.map((setting) => (
            <motion.div
              key={setting.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: displaySettingsList.indexOf(setting) * 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl liquid-card border border-white/40 hover:bg-white/30 transition-all duration-200 group"
            >
              <span className="text-slate-700 group-hover:text-slate-900 transition-colors">
                {setting.label}
              </span>
              <Switch.Root
                checked={displaySettings[setting.id]}
                onCheckedChange={() => toggleDisplaySetting(setting.id)}
                className="liquid-toggle"
              >
                <Switch.Thumb className="liquid-toggle-thumb" />
              </Switch.Root>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="liquid-panel rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Оформление</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {themes.map((theme) => (
            <motion.button
              key={theme.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: themes.indexOf(theme) * 0.05 }}
              onClick={() => setTheme(theme.id)}
              className={`relative rounded-xl p-4 liquid-card border-2 transition-all duration-200 group ${
                currentTheme === theme.id
                  ? "border-violet-500 shadow-lg"
                  : "border-white/40 hover:border-white/60"
              }`}
            >
              {currentTheme === theme.id && (
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check className="size-4 text-white" />
                </div>
              )}
              <div
                className="h-24 rounded-lg mb-3 relative overflow-hidden"
                style={{ background: theme.preview.gradient }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              </div>
              <div className="text-left">
                <div className="font-medium text-slate-900 text-sm mb-1">{theme.name}</div>
                <div className="text-xs text-slate-600">{theme.description}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Интеграции</h2>
        <div className="space-y-8">
          {integrations.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: integrations.indexOf(category) * 0.1 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-slate-900">{category.label}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.integrations.map((integration) => (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: category.integrations.indexOf(integration) * 0.05 }}
                    className="liquid-panel rounded-2xl p-4 hover:shadow-lg transition-all duration-200 group relative"
                  >
                    <DropdownMenu.Root modal={false}>
                      <DropdownMenu.Trigger asChild>
                        <button className="absolute top-4 right-4 h-8 w-8 grid place-items-center rounded-lg liquid-card hover:bg-white/40 transition-all z-10">
                          <MoreVertical className="size-4 text-slate-500" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          side="bottom"
                          align="end"
                          sideOffset={8}
                          className="min-w-[160px] rounded-xl liquid-panel p-2 shadow-2xl border backdrop-blur-xl"
                          style={{ zIndex: 1000 }}
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <DropdownMenu.Item className="px-3 py-2 rounded-lg text-sm hover:bg-white/40 cursor-pointer transition-all outline-none data-[highlighted]:bg-white/50">
                            Настройки
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="px-3 py-2 rounded-lg text-sm hover:bg-white/40 cursor-pointer transition-all outline-none data-[highlighted]:bg-white/50">
                            Отключить
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                    <div className="h-32 rounded-xl liquid-card mb-4 overflow-hidden relative">
                      {getLogo(integration.logo)}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900 mb-1">{integration.name}</div>
                        <button className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                          Подключить
                        </button>
                      </div>
                      <Switch.Root
                        checked={integration.connected}
                        onCheckedChange={() => toggleIntegration(category.id, integration.id)}
                        className="liquid-toggle"
                      >
                        <Switch.Thumb className="liquid-toggle-thumb" />
                      </Switch.Root>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (integrations.indexOf(category) + 1) * 0.1 + category.integrations.length * 0.05 }}
                className="mt-4"
              >
                <button
                  className="w-full liquid-panel rounded-2xl p-4 flex items-center justify-center gap-3 group transition-all duration-200 hover:shadow-lg border border-white/60 hover:border-white/80"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(150px) saturate(180%) brightness(110%)',
                    WebkitBackdropFilter: 'blur(150px) saturate(180%) brightness(110%)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.35), inset 0 0 160px rgba(255,255,255,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(255,255,255,0.3), inset 0 0 140px rgba(255,255,255,0.1)';
                  }}
                >
                  <div className="h-10 w-10 rounded-xl liquid-card grid place-items-center group-hover:scale-110 transition-transform duration-200">
                    <Plus className="size-5 text-slate-700 group-hover:text-slate-900 transition-colors" />
                  </div>
                  <span className="font-medium text-slate-900 group-hover:text-slate-950 transition-colors">
                    Добавить интеграцию
                  </span>
                </button>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

