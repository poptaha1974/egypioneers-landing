import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homePage = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");

describe("مرئيات تأكيد تسجيل الويبنار", () => {
  it("يعرض حالة تحميل مفهومة ويمنع العميل من إغلاق الصفحة أثناء الإرسال", () => {
    expect(homePage).toContain("بنثبت تسجيلك... متقفلش الصفحة");
    expect(homePage).toContain("لحظة واحدة، تسجيلك شغال الآن");
    expect(homePage).toContain("role=\"status\"");
    expect(homePage).toContain("aria-live=\"polite\"");
  });
});
