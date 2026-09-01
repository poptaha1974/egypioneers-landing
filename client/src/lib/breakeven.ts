export type CalcInputs = {
  price: number;
  productCost: number;
  shipping: number;
  operating: number;
  extra: number;
};

export type Tone = "safe" | "tight" | "loss";

export type VerdictTone = Tone | "idle" | "blocked";

export type Verdict = {
  tone: VerdictTone;
  title: string;
  detail: string;
  action: string;
};

export type ScenarioRow = {
  ratio: number;
  label: string;
  cpa: number;
  profit: number;
  netMarginPct: number;
  roas: number | null;
  tone: Tone;
};

/** نسب من حد التعادل نعرض عندها ربح الأوردر. */
export const SCENARIO_RATIOS = [0.4, 0.6, 0.8, 1, 1.2];

/** أقصى نسبة من حد التعادل نعتبرها مساحة أمان مريحة. */
export const SAFE_RATIO = 0.7;

const num = (value: number) => (Number.isFinite(value) ? value : 0);

export function totalCost(inputs: CalcInputs): number {
  return (
    num(inputs.productCost) +
    num(inputs.shipping) +
    num(inputs.operating) +
    num(inputs.extra)
  );
}

/** أقصى تكلفة إعلان للأوردر قبل ما الربح يبقى صفر. */
export function breakEvenCpa(inputs: CalcInputs): number {
  return num(inputs.price) - totalCost(inputs);
}

/** حد التعادل كنسبة من سعر البيع. */
export function marginPct(inputs: CalcInputs): number {
  const price = num(inputs.price);
  if (price <= 0) return 0;
  return (breakEvenCpa(inputs) / price) * 100;
}

/** ربح الأوردر الواحد عند تكلفة إعلان معينة. */
export function profitAt(inputs: CalcInputs, cpa: number): number {
  return breakEvenCpa(inputs) - num(cpa);
}

export function toneForCpa(cpa: number, breakEven: number): Tone {
  if (breakEven <= 0) return "loss";
  const ratio = num(cpa) / breakEven;
  if (ratio <= SAFE_RATIO) return "safe";
  if (ratio < 1) return "tight";
  return "loss";
}

export function scenarios(inputs: CalcInputs): ScenarioRow[] {
  const price = num(inputs.price);
  const breakEven = breakEvenCpa(inputs);

  return SCENARIO_RATIOS.map(ratio => {
    const cpa = Math.max(breakEven, 0) * ratio;
    const profit = profitAt(inputs, cpa);
    return {
      ratio,
      label: `${Math.round(ratio * 100)}% من حد التعادل`,
      cpa,
      profit,
      netMarginPct: price > 0 ? (profit / price) * 100 : 0,
      roas: cpa > 0 ? price / cpa : null,
      tone: toneForCpa(cpa, breakEven),
    };
  });
}

export function getVerdict(
  margin: number,
  actualCpa: number | null,
  breakEven: number
): Verdict {
  if (breakEven <= 0) {
    return {
      tone: "blocked",
      title: "التكاليف أكلت سعر البيع",
      detail:
        "مفيش أي مساحة للإعلان — المنتج بيخسر من غير ما تدفع مليم واحد إعلانات.",
      action: "ارفع سعر البيع أو نزّل تكلفة المنتج/الشحن قبل ما تفتح أي حملة.",
    };
  }

  if (actualCpa === null) {
    return margin < 20
      ? {
          tone: "tight",
          title: `هامشك ضيق (${margin.toFixed(1)}%)`,
          detail: `أقصى تكلفة إعلان للأوردر ${breakEven.toFixed(0)} جنيه بس، وده بيخليك حساس لأي زيادة في CPA.`,
          action:
            "اكتب تكلفة الإعلان الفعلية للأوردر عشان نحسبلك الربح الحقيقي.",
        }
      : {
          tone: "idle",
          title: "الأرقام جاهزة",
          detail: `حد التعادل عندك ${breakEven.toFixed(0)} جنيه للأوردر، بهامش ${margin.toFixed(1)}% من سعر البيع.`,
          action:
            "اكتب تكلفة الإعلان الفعلية للأوردر عشان نقولك بتكسب ولا بتخسر.",
        };
  }

  const profit = breakEven - num(actualCpa);
  const tone = toneForCpa(actualCpa, breakEven);

  if (tone === "safe") {
    return {
      tone,
      title: `بتكسب ${profit.toFixed(0)} جنيه على الأوردر`,
      detail: `تكلفتك ${num(actualCpa).toFixed(0)} جنيه مقابل حد تعادل ${breakEven.toFixed(0)} جنيه — عندك مساحة أمان مريحة.`,
      action: "دي منطقة تكبير: زوّد الميزانية بالتدريج وراقب الـCPA كل يوم.",
    };
  }

  if (tone === "tight") {
    return {
      tone,
      title: `بتكسب ${profit.toFixed(0)} جنيه بس على الأوردر`,
      detail: `تكلفتك ${num(actualCpa).toFixed(0)} جنيه قريبة من حد التعادل ${breakEven.toFixed(0)} جنيه — أي مرتجع أو زيادة بسيطة هتاكل الربح.`,
      action:
        "ثبّت الميزانية، اشتغل على رفع نسبة التأكيد أو تقليل تكلفة الشحن قبل التوسع.",
    };
  }

  return {
    tone,
    title:
      profit === 0
        ? "واقف على حد التعادل"
        : `بتخسر ${Math.abs(profit).toFixed(0)} جنيه على الأوردر`,
    detail: `تكلفتك ${num(actualCpa).toFixed(0)} جنيه مقابل حد تعادل ${breakEven.toFixed(0)} جنيه.`,
    action:
      "وقّف التوسع: نزّل الـCPA، أو ارفع السعر، أو راجع تكلفة المنتج والشحن.",
  };
}

const egpFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatEgp(value: number): string {
  return `${egpFormatter.format(Math.round(num(value)))} ج.م`;
}

export function formatPct(value: number): string {
  return `${num(value).toFixed(1)}%`;
}
