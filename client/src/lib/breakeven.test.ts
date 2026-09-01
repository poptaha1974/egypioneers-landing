import { describe, expect, it } from "vitest";

import {
  breakEvenCpa,
  getVerdict,
  marginPct,
  profitAt,
  scenarios,
  toneForCpa,
  totalCost,
  type CalcInputs,
} from "./breakeven";

const product: CalcInputs = {
  price: 550,
  productCost: 250,
  shipping: 60,
  operating: 25,
  extra: 15,
};

describe("حساب حد التعادل", () => {
  it("يجمع كل بنود التكلفة ما عدا الإعلان", () => {
    expect(totalCost(product)).toBe(350);
  });

  it("يحسب أقصى تكلفة إعلان للأوردر وهامشها من سعر البيع", () => {
    expect(breakEvenCpa(product)).toBe(200);
    expect(marginPct(product)).toBeCloseTo(36.36, 2);
  });

  it("يرجّع صفر هامش لو سعر البيع صفر بدل قسمة غير معرّفة", () => {
    expect(marginPct({ ...product, price: 0 })).toBe(0);
  });

  it("يحسب ربح الأوردر عند تكلفة إعلان معينة", () => {
    expect(profitAt(product, 120)).toBe(80);
    expect(profitAt(product, 200)).toBe(0);
    expect(profitAt(product, 260)).toBe(-60);
  });

  it("يصنّف التكلفة آمنة أو ضيقة أو خسارة حسب نسبتها من حد التعادل", () => {
    expect(toneForCpa(120, 200)).toBe("safe");
    expect(toneForCpa(180, 200)).toBe("tight");
    expect(toneForCpa(200, 200)).toBe("loss");
    expect(toneForCpa(50, 0)).toBe("loss");
  });
});

describe("سيناريوهات تكلفة الإعلان", () => {
  it("يبني الصفوف كنسب من حد التعادل مع ربح وROAS لكل صف", () => {
    const rows = scenarios(product);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({
      ratio: 0.4,
      cpa: 80,
      profit: 120,
      tone: "safe",
    });
    expect(rows[0].roas).toBeCloseTo(6.875, 3);
    expect(rows[3]).toMatchObject({
      ratio: 1,
      cpa: 200,
      profit: 0,
      tone: "loss",
    });
    expect(rows[4].profit).toBe(-40);
  });

  it("يخلي التكلفة صفر والـROAS غير متاح لما التكاليف تاكل السعر", () => {
    const rows = scenarios({ ...product, productCost: 600 });
    expect(rows.every(row => row.cpa === 0)).toBe(true);
    expect(rows.every(row => row.roas === null)).toBe(true);
    expect(rows.every(row => row.tone === "loss")).toBe(true);
  });
});

describe("الحكم على الأرقام", () => {
  it("يمنع الإعلان لما التكاليف تساوي السعر أو تزيد عنه", () => {
    const blocked = { ...product, productCost: 600 };
    expect(getVerdict(marginPct(blocked), 50, breakEvenCpa(blocked)).tone).toBe(
      "blocked"
    );
  });

  it("يطلب تكلفة الإعلان الفعلية طالما مفيش رقم مكتوب", () => {
    expect(
      getVerdict(marginPct(product), null, breakEvenCpa(product)).tone
    ).toBe("idle");
  });

  it("ينبّه على الهامش الضيق حتى قبل كتابة تكلفة الإعلان", () => {
    const thin = { ...product, productCost: 420 };
    expect(getVerdict(marginPct(thin), null, breakEvenCpa(thin)).tone).toBe(
      "tight"
    );
  });

  it("يفرّق بين مساحة الأمان والاقتراب من الحد والخسارة", () => {
    const be = breakEvenCpa(product);
    const margin = marginPct(product);
    expect(getVerdict(margin, 120, be).tone).toBe("safe");
    expect(getVerdict(margin, 180, be).tone).toBe("tight");
    expect(getVerdict(margin, 260, be).tone).toBe("loss");
  });
});
