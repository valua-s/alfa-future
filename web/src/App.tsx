import "./styles/globals.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Shell } from "./components/layout/Shell";
import { Dashboard } from "./features/dashboard/Dashboard";
import { Settings } from "./features/settings/Settings";
import "./lib/i18n";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import { useState, useEffect } from "react";

export function App() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || "/");

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash.slice(1) || "/");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <I18nextProvider i18n={i18next}>
      <QueryClientProvider client={queryClient}>
        <Shell>
          {route === "/settings" ? <Settings /> : <Dashboard />}
        </Shell>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
