import { createServer, Model, Response } from "miragejs";
import { faker } from "@faker-js/faker/locale/ru";

type Summary = {
  total: number;
};
type Issue = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  status: "open" | "resolved";
};
type AnalyticsPoint = { date: string; value: number };
type ReportItem = { id: string; time: string; text: string };

export function makeServer() {
  return createServer({
    models: {
      summary: Model.extend<Partial<Summary>>({}),
      issue: Model.extend<Partial<Issue>>({}),
      report: Model.extend<Partial<ReportItem>>({}),
    },
    seeds(server) {
      server.create("summary", { total: 5678.02 });
      for (let i = 0; i < 6; i++) {
        server.create("issue", {
          id: String(i + 1),
          title: faker.commerce.productName(),
          severity: faker.helpers.arrayElement(["low", "medium", "high"]),
          status: faker.helpers.arrayElement(["open", "resolved"]),
        });
      }
      const messages = [
        "Импорт банковских операций завершён успешно",
        "Сверка платежей с 1С завершена, расхождений не найдено",
        "Обновлены данные по контрагентам из ФНС",
        "Сформирован отчёт ДДС за неделю",
        "Создан проект счёта для клиента ООО «Бета»",
        "Обнаружены дубли документов, предложена консолидация",
      ];
      messages.forEach((m, idx) =>
        server.create("report", {
          id: String(idx + 1),
          time: faker.date.recent({ days: 7 }).toISOString(),
          text: m,
        }),
      );
    },
    routes() {
      this.namespace = "api";

      this.get("/summary", (schema) => {
        const s = schema.first("summary") as { attrs: Summary };
        return s?.attrs ?? { total: 0 };
      });

      this.get("/issues", (schema) => {
        return schema.all("issue").models.map((m: any) => m.attrs);
      });

      this.get("/analytics", () => {
        const base = new Date();
        const points: AnalyticsPoint[] = Array.from({ length: 14 }).map((_, i) => {
          const d = new Date(base);
          d.setDate(base.getDate() - (13 - i));
          return { date: d.toISOString(), value: Math.round(3000 + Math.sin(i / 2) * 800 + Math.random() * 400) };
        });
        return points;
      });

      this.get("/agents/report", (schema) => {
        return schema.all("report").models.map((m: any) => m.attrs);
      });

      this.passthrough((req) => req.url.includes("/assets/"));
      this.passthrough((req) => req.url.includes("/dist/"));
      this.passthrough();
    },
    timing: 400,
  });
}


