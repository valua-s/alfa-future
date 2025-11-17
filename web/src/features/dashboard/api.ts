import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const SummarySchema = z.object({ total: z.number() });
const IssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.union([z.literal("low"), z.literal("medium"), z.literal("high")]),
  status: z.union([z.literal("open"), z.literal("resolved")]),
});
const AnalyticsPointSchema = z.object({ date: z.string(), value: z.number() });
const ReportItemSchema = z.object({ id: z.string(), time: z.string(), text: z.string() });

export type Summary = z.infer<typeof SummarySchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type AnalyticsPoint = z.infer<typeof AnalyticsPointSchema>;
export type ReportItem = z.infer<typeof ReportItemSchema>;

const api = axios.create({ baseURL: "/api" });

export function useSummary() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: async () => SummarySchema.parse((await api.get("/summary")).data),
  });
}

export function useIssues() {
  return useQuery({
    queryKey: ["issues"],
    queryFn: async () => z.array(IssueSchema).parse((await api.get("/issues")).data),
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => z.array(AnalyticsPointSchema).parse((await api.get("/analytics")).data),
  });
}

export function useAgentReport() {
  return useQuery({
    queryKey: ["report"],
    queryFn: async () => z.array(ReportItemSchema).parse((await api.get("/agents/report")).data),
  });
}


