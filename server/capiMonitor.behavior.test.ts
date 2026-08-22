import { describe, expect, it, vi } from "vitest";
import { runDailyCapiMonitor, scanRecentCapiErrors } from "./capiMonitor";

const previousKey = process.env.N8N_API_KEY;
process.env.N8N_API_KEY = "test-key";

describe("سلوك مراقب CAPI", () => {
  it("لا يرسل تنبيهاً عند خلو التنفيذات من أخطاء CAPI", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ id: "1", status: "success" }] }) });
    const notify = vi.fn();

    await expect(runDailyCapiMonitor({ request, notify })).resolves.toMatchObject({ issueCount: 0, notified: false });
    expect(notify).not.toHaveBeenCalled();
  });

  it("يرصد 5xx في عقدة CAPI ويرسل إخطاراً واحداً للمالك", async () => {
    const request = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{
          id: "20401",
          status: "error",
          data: {
            resultData: {
              runData: {
                "CAPI V2 Web → Meta": [
                  { data: { main: [[{ json: { statusCode: 500 } }]] } },
                ],
              },
            },
          },
        }],
      }),
    });
    const notify = vi.fn().mockResolvedValue(true);

    const result = await runDailyCapiMonitor({ request, notify });
    expect(result.issueCount).toBe(2);
    expect(notify).toHaveBeenCalledOnce();
    expect(notify.mock.calls[0][0].content).toContain("HTTP 500");
  });

  it("يعيد خطأً واضحاً عندما ترفض n8n قراءة التنفيذات", async () => {
    const request = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    await expect(scanRecentCapiErrors(request)).rejects.toThrow("HTTP 401");
  });
});

process.on("exit", () => {
  process.env.N8N_API_KEY = previousKey;
});
