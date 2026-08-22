import { notifyOwner } from "./_core/notification";

const DEFAULT_N8N_BASE_URL = "https://allhomz.app.n8n.cloud";
const CAPI_WORKFLOWS = [
  { id: "5VLxiLTVKhWVgg1V", name: "CAPI V2 Web" },
  { id: "swr2aTOO9NZ5dvQE", name: "Lead Qualifier / Legacy Guard" },
];

export type CapiMonitorIssue = {
  workflow: string;
  executionId: string;
  statusCode: number | null;
  summary: string;
};

type N8nExecution = Record<string, unknown>;
type FetchResponse = Pick<Response, "ok" | "status" | "json" | "text">;
type MonitorDependencies = {
  request?: (input: string, init?: RequestInit) => Promise<FetchResponse>;
  notify?: typeof notifyOwner;
};

function collectHttpStatusCodes(value: unknown, found: number[] = []): number[] {
  if (Array.isArray(value)) {
    value.forEach(item => collectHttpStatusCodes(item, found));
    return found;
  }
  if (!value || typeof value !== "object") return found;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (["status", "statusCode", "httpCode"].includes(key) && typeof nested === "number" && nested >= 400 && nested <= 599) {
      found.push(nested);
    }
    collectHttpStatusCodes(nested, found);
  }
  return found;
}

function getNodeNames(execution: N8nExecution): string[] {
  const runs = (execution.data as Record<string, unknown> | undefined)?.resultData as Record<string, unknown> | undefined;
  const runData = runs?.runData;
  return runData && typeof runData === "object" ? Object.keys(runData as Record<string, unknown>) : [];
}

function identifyCapiIssues(workflow: string, execution: N8nExecution): CapiMonitorIssue[] {
  const executionId = String(execution.id ?? "unknown");
  const nodeNames = getNodeNames(execution);
  const capiNodes = nodeNames.filter(name => /(capi|meta)/i.test(name));
  const statusCodes = collectHttpStatusCodes(execution).filter(code => code >= 400 && code <= 599);
  const executionFailed = String(execution.status ?? "").toLowerCase() === "error";

  if (!executionFailed && statusCodes.length === 0) return [];
  const deduplicatedCodes = Array.from(new Set(statusCodes));
  const httpSummary = deduplicatedCodes.length
    ? `Meta CAPI أعاد HTTP ${deduplicatedCodes.join(", ")}${capiNodes.length ? ` عند ${capiNodes.join(", ")}` : ""}`
    : "";
  return [{
    workflow,
    executionId,
    statusCode: deduplicatedCodes[0] ?? null,
    summary: executionFailed
      ? `${httpSummary || `تنفيذ CAPI فشل${capiNodes.length ? ` عند ${capiNodes.join(", ")}` : ""}`}${httpSummary ? "; فشل التنفيذ" : ""}`
      : httpSummary,
  }];
}

export async function validateN8nMonitorAccess(
  request: (input: string, init?: RequestInit) => Promise<FetchResponse> = fetch,
): Promise<boolean> {
  const apiKey = process.env.N8N_API_KEY;
  if (!apiKey) return false;

  const baseUrl = (process.env.N8N_INSTANCE_URL || DEFAULT_N8N_BASE_URL).replace(/\/$/, "");
  const response = await request(`${baseUrl}/api/v1/workflows?limit=1`, {
    headers: { "X-N8N-API-KEY": apiKey },
  });

  return response.ok;
}

export async function scanRecentCapiErrors(
  request: (input: string, init?: RequestInit) => Promise<FetchResponse> = fetch,
): Promise<CapiMonitorIssue[]> {
  const apiKey = process.env.N8N_API_KEY;
  if (!apiKey) throw new Error("N8N_API_KEY غير مضبوط لمراقب CAPI");

  const baseUrl = (process.env.N8N_INSTANCE_URL || DEFAULT_N8N_BASE_URL).replace(/\/$/, "");
  const issues: CapiMonitorIssue[] = [];
  for (const workflow of CAPI_WORKFLOWS) {
    const url = new URL(`${baseUrl}/api/v1/executions`);
    url.searchParams.set("workflowId", workflow.id);
    url.searchParams.set("limit", "100");
    url.searchParams.set("includeData", "true");

    const response = await request(url.toString(), { headers: { "X-N8N-API-KEY": apiKey } });
    if (!response.ok) throw new Error(`فشل فحص ${workflow.name}: HTTP ${response.status}`);
    const payload = (await response.json()) as { data?: N8nExecution[] };
    for (const execution of payload.data ?? []) {
      issues.push(...identifyCapiIssues(workflow.name, execution));
    }
  }
  return issues;
}

export async function runDailyCapiMonitor(deps: MonitorDependencies = {}) {
  const issues = await scanRecentCapiErrors(deps.request ?? fetch);
  if (issues.length === 0) return { ok: true, issueCount: 0, notified: false, issues: [] };

  const content = issues
    .slice(0, 10)
    .map(issue => `• ${issue.workflow} | تنفيذ ${issue.executionId} | ${issue.summary}`)
    .join("\n");
  const notified = await (deps.notify ?? notifyOwner)({
    title: `تنبيه CAPI: ${issues.length} خطأ 4xx/5xx أو فشل تنفيذ`,
    content: `${content}\n\nافتح سجل n8n قبل إعادة إرسال أي Event؛ لا تعِد الإرسال يدوياً حتى يتحدد سبب الخطأ.`,
  });
  return { ok: true, issueCount: issues.length, notified, issues };
}
