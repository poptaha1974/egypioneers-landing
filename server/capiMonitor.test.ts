import { describe, expect, it } from "vitest";
import { scanRecentCapiErrors, validateN8nMonitorAccess } from "./capiMonitor";

describe("اعتماد مراقبة CAPI", () => {
  it(
    "يتحقق من مفتاح n8n عبر قراءة خفيفة للـWorkflows",
    async () => {
      await expect(validateN8nMonitorAccess()).resolves.toBe(true);
    },
    15_000,
  );

  it(
    "يقرأ تنفيذات CAPI في وضع المراقبة فقط",
    async () => {
      await expect(scanRecentCapiErrors()).resolves.toBeInstanceOf(Array);
    },
    20_000,
  );
});
