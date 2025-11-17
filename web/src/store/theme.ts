import { create } from "zustand";

export type ThemeId = 
  | "frozen-blue"
  | "ocean"
  | "sunset"
  | "forest"
  | "purple"
  | "minimal"
  | "aurora"
  | "sakura";

export type Theme = {
  id: ThemeId;
  name: string;
  description: string;
  preview: {
    gradient: string;
    color1: string;
    color2: string;
    color3: string;
  };
  blobHue: [number, number];
  blobSaturation: number;
};

const themes: Theme[] = [
  {
    id: "frozen-blue",
    name: "Frozen Blue",
    description: "Классический ледяной голубой",
    preview: {
      gradient: "linear-gradient(135deg, #93c5fd 0%, #dbeafe 50%, #f0f9ff 100%)",
      color1: "#93c5fd",
      color2: "#dbeafe",
      color3: "#f0f9ff",
    },
    blobHue: [180, 240],
    blobSaturation: 75,
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Глубокий океанский",
    preview: {
      gradient: "linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #67e8f9 100%)",
      color1: "#06b6d4",
      color2: "#22d3ee",
      color3: "#67e8f9",
    },
    blobHue: [185, 200],
    blobSaturation: 80,
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Теплый закатный",
    preview: {
      gradient: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #fdba74 100%)",
      color1: "#fb923c",
      color2: "#f97316",
      color3: "#fdba74",
    },
    blobHue: [15, 35],
    blobSaturation: 85,
  },
  {
    id: "forest",
    name: "Forest",
    description: "Свежий лесной",
    preview: {
      gradient: "linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)",
      color1: "#10b981",
      color2: "#34d399",
      color3: "#6ee7b7",
    },
    blobHue: [145, 165],
    blobSaturation: 75,
  },
  {
    id: "purple",
    name: "Purple Dream",
    description: "Фиолетовые грезы",
    preview: {
      gradient: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 50%, #e9d5ff 100%)",
      color1: "#a78bfa",
      color2: "#c4b5fd",
      color3: "#e9d5ff",
    },
    blobHue: [250, 280],
    blobSaturation: 70,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Минималистичный",
    preview: {
      gradient: "linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 50%, #ffffff 100%)",
      color1: "#e5e7eb",
      color2: "#f3f4f6",
      color3: "#ffffff",
    },
    blobHue: [0, 360],
    blobSaturation: 5,
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Северное сияние",
    preview: {
      gradient: "linear-gradient(135deg, #34d399 0%, #22d3ee 50%, #a78bfa 100%)",
      color1: "#34d399",
      color2: "#22d3ee",
      color3: "#a78bfa",
    },
    blobHue: [150, 280],
    blobSaturation: 75,
  },
  {
    id: "sakura",
    name: "Sakura",
    description: "Вишневый цвет",
    preview: {
      gradient: "linear-gradient(135deg, #f9a8d4 0%, #f472b6 50%, #ec4899 100%)",
      color1: "#f9a8d4",
      color2: "#f472b6",
      color3: "#ec4899",
    },
    blobHue: [320, 340],
    blobSaturation: 75,
  },
];

type ThemeState = {
  currentTheme: ThemeId;
  themes: Theme[];
  setTheme: (themeId: ThemeId) => void;
  getTheme: () => Theme;
};

const getStoredTheme = (): ThemeId => {
  if (typeof window === "undefined") return "minimal";
  const stored = localStorage.getItem("theme-storage");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.state?.currentTheme || "minimal";
    } catch {
      return "minimal";
    }
  }
  return "minimal";
};

export const useTheme = create<ThemeState>((set, get) => ({
  currentTheme: getStoredTheme(),
  themes,
  setTheme: (themeId) => {
    set({ currentTheme: themeId });
    if (typeof window !== "undefined") {
      localStorage.setItem("theme-storage", JSON.stringify({ state: { currentTheme: themeId } }));
    }
  },
  getTheme: () => themes.find((t) => t.id === get().currentTheme) || themes[0],
}));

