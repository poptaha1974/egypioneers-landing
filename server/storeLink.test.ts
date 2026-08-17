import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getStoreProgressState,
  hasThreeStoreOnboardingSteps,
  isEgyPioneersStoreUrl,
  STORE_ONBOARDING_STEPS,
  STORE_TRACKING_EVENTS,
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

  it("يعرض 33% وتوجيه الخطوة التالية بعد إتمام أول خطوة", () => {
    expect(getStoreProgressState(1)).toMatchObject({
      completedSteps: 1,
      totalSteps: 3,
      progressPercent: 33,
      isFirstStepComplete: true,
      nextStep: { number: "02", title: "دور وقارن" },
    });
  });

  it("يحدد أحداث Meta مخصصة مستقلة لدليل المنصة وفتحها وإتمام الخطوة الأولى", () => {
    expect(STORE_TRACKING_EVENTS).toEqual({
      guideOpened: "WholesalePlatformGuideOpen",
      platformOpened: "WholesalePlatformOpen",
      firstStepCompleted: "WholesalePlatformStepOneCompleted",
    });
  });

  it("يفتح زر التطبيق بعد المحاضرة منصة المنتجات مباشرة في تبويب جديد", () => {
    const homePageSource = readFileSync(
      resolve(process.cwd(), "client/src/pages/Home.tsx"),
      "utf8",
    );
    const storeCtaStart = homePageSource.indexOf("شوف اللي هتطبقه بعد المحاضرة");
    const storeCtaSection = homePageSource.slice(Math.max(0, storeCtaStart - 700), storeCtaStart + 200);

    expect(storeCtaSection).toContain("href={STORE_URL}");
    expect(storeCtaSection).toContain('target="_blank"');
    expect(storeCtaSection).toContain("onClick={handleStoreClick}");
    expect(storeCtaSection).not.toContain("onClick={openStoreGuide}");
  });
});
