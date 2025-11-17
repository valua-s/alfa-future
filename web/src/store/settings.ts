import { create } from "zustand";

type DisplaySettings = {
  calendar: boolean;
  dailyReport: boolean;
  monthlyReport: boolean;
  balance: boolean;
  tax: boolean;
  problems: boolean;
};

type WidgetOrder = {
  id: string;
  order: number;
};

type SettingsState = {
  displaySettings: DisplaySettings;
  widgetOrder: WidgetOrder[];
  toggleDisplaySetting: (key: keyof DisplaySettings) => void;
  updateWidgetOrder: (order: WidgetOrder[]) => void;
  getWidgetOrder: (id: string) => number;
};

const getStoredSettings = (): DisplaySettings => {
  if (typeof window === "undefined") {
    return {
      calendar: false,
      dailyReport: false,
      monthlyReport: false,
      balance: true,
      tax: false,
      problems: true,
    };
  }
  const stored = localStorage.getItem("display-settings");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.displaySettings || parsed;
    } catch {
      return {
        calendar: false,
        dailyReport: false,
        monthlyReport: false,
        balance: true,
        tax: false,
        problems: true,
      };
    }
  }
  return {
    calendar: false,
    dailyReport: false,
    monthlyReport: false,
    balance: true,
    tax: false,
    problems: true,
  };
};

const getDefaultWidgetOrder = (): WidgetOrder[] => {
  return [
    { id: "calendar", order: 0 },
    { id: "dailyReport", order: 1 },
    { id: "monthlyReport", order: 2 },
    { id: "balance", order: 3 },
    { id: "tax", order: 4 },
    { id: "problems", order: 5 },
    { id: "analytics", order: 6 },
    { id: "agentReport", order: 7 },
  ];
};

const getStoredWidgetOrder = (): WidgetOrder[] => {
  if (typeof window === "undefined") return getDefaultWidgetOrder();
  const stored = localStorage.getItem("widget-order");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return getDefaultWidgetOrder();
    }
  }
  return getDefaultWidgetOrder();
};

export const useSettings = create<SettingsState>((set, get) => ({
  displaySettings: getStoredSettings(),
  widgetOrder: getStoredWidgetOrder(),
  toggleDisplaySetting: (key) => {
    const newSettings = {
      ...get().displaySettings,
      [key]: !get().displaySettings[key],
    };
    set({ displaySettings: newSettings });
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("settings-store");
      const store = existing ? JSON.parse(existing) : {};
      store.displaySettings = newSettings;
      localStorage.setItem("settings-store", JSON.stringify(store));
      localStorage.setItem("display-settings", JSON.stringify(newSettings));
    }
  },
  updateWidgetOrder: (order) => {
    set({ widgetOrder: order });
    if (typeof window !== "undefined") {
      localStorage.setItem("widget-order", JSON.stringify(order));
    }
  },
  getWidgetOrder: (id) => {
    const order = get().widgetOrder.find((w) => w.id === id);
    return order ? order.order : 999;
  },
}));

