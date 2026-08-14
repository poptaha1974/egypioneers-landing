import { describe, expect, it } from "vitest";
import { isEgyPioneersStoreUrl, STORE_URL } from "../client/src/lib/storeLink";

describe("رابط منصة منتجات Egy-Pioneers", () => {
  it("يشير إلى الصفحة الرئيسية الآمنة لمنصة المنتجات الرسمية", () => {
    expect(isEgyPioneersStoreUrl(STORE_URL)).toBe(true);
  });

  it("يرفض الروابط غير التابعة لمنصة منتجات الشركة", () => {
    expect(isEgyPioneersStoreUrl("https://example.com/home")).toBe(false);
  });
});
