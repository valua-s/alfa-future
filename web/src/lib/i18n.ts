import i18next from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ru: {
    translation: {
      nav: { finance: "Финансы", contractors: "Контрагенты", marketing: "Маркетинг", documents: "Документы" },
      title: "Функции ИИ агента",
      balance: "Баланс",
      issues: "Проблемы, выявленные ИИ агентом",
      analytics: "Аналитика или статистика",
      report: "Отчет о работе ИИ агента",
      search: "Поиск",
    },
  },
};

i18next.use(initReactI18next).init({
  resources,
  lng: "ru",
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
});

export default i18next;


