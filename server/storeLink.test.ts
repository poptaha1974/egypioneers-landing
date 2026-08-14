import { describe, expect, it } from "vitest";
import {
  hasThreeStoreOnboardingSteps,
  isEgyPioneersStoreUrl,
  STORE_ONBOARDING_STEPS,
  STORE_URL,
} from "../client/src/lib/storeLink";

describe("رابط منصة منتجات Egy-Pioneers", () => {
  it("يشير إلى الصفحة الرئيسية الآمنة لمنصة المنتجات الرسمية", () => {
    expect(isEgyPioneersStoreUrl(STORE_URL)).toBe(true);
  });

  it("يرفض الروابط غير التابعة لمنصة منتجات الشركة", () => {
    expect(isEgyPioneersStoreUrl("https://example.com/home")).toBe(false);
  });

  it("يوفّر للمتدرب أول ثلاث خطوات عملية قبل تنفيذ الطلب", () => {
    expect(hasThreeStoreOnboardingSteps()).toBe(true);
    expect(STORE_ONBOARDING_STEPS.map((step) => step.title)).toEqual([
      "سجّل دخولك",
      "دور وقارن",
      "راجع واطلب",
    ]);
  });
});
