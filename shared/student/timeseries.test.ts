import { describe, expect, it } from "vitest";

import {
  candles,
  cumulative,
  cusum,
  ema,
  ewmaControlChart,
  linearTrend,
  mannKendall,
  maxDrawdown,
  rollingStdDev,
  sma,
  stdDev,
  zScores,
  type Point,
} from "./timeseries";

const series = (values: Array<number | null>): Point[] =>
  values.map((value, index) => ({
    date: `2026-08-${String(index + 1).padStart(2, "0")}`,
    value,
  }));

describe("المتوسطات المتحركة", () => {
  it("يسيب النقاط الأولى null لحد ما النافذة تكتمل", () => {
    const result = sma(series([1, 2, 3, 4]), 3);
    expect(result.map(point => point.value)).toEqual([null, null, 2, 3]);
  });

  it("يتخطى اليوم الناقص من غير ما يعتبره صفر", () => {
    const result = sma(series([10, null, 10, 10]), 3);
    expect(result[1].value).toBeNull();
    expect(result[3].value).toBe(10);
  });

  it("يحسب EMA بمعامل 2/(span+1)", () => {
    const result = ema(series([10, 20]), 1);
    expect(result[0].value).toBe(10);
    expect(result[1].value).toBe(20);
  });
});

describe("التشتت والتراجع", () => {
  it("يحسب الانحراف المعياري للعينة", () => {
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
    expect(stdDev([5])).toBeNull();
  });

  it("يحسب التقلب المتحرك ودرجات z", () => {
    expect(rollingStdDev(series([1, 1, 1, 5]), 2)[3].value).toBeCloseTo(
      2.828,
      3
    );
    const z = zScores(series([10, 20, 30]));
    expect(z[1].value).toBeCloseTo(0, 6);
    expect(z[2].value).toBeGreaterThan(0);
  });

  it("يبني السلسلة التراكمية ويحسب أقصى تراجع", () => {
    expect(cumulative(series([10, -4, 6])).map(point => point.value)).toEqual([
      10, 6, 12,
    ]);
    const drawdown = maxDrawdown(series([10, -4, 6]));
    expect(drawdown).toMatchObject({ peak: 10, trough: 6, depth: 4 });
  });

  it("يرجّع null لو مفيش تراجع أصلاً", () => {
    expect(maxDrawdown(series([1, 1, 1]))).toBeNull();
  });
});

describe("الاتجاه", () => {
  it("يحسب ميل الانحدار مع فاصل ثقة 95%", () => {
    const trend = linearTrend(series([1, 2, 3, 4, 5]));
    expect(trend?.slope).toBeCloseTo(1, 6);
    expect(trend?.r2).toBeCloseTo(1, 6);
    expect(trend?.ci95?.[0]).toBeLessThanOrEqual(1);
    expect(trend?.ci95?.[1]).toBeGreaterThanOrEqual(1);
  });

  it("يرجّع null لو النقاط أقل من اتنين", () => {
    expect(linearTrend(series([5]))).toBeNull();
  });

  it("Mann–Kendall يكشف الاتجاه الصاعد ويحتاج 8 نقاط", () => {
    expect(mannKendall(series([1, 2, 3]))).toBeNull();
    const rising = mannKendall(series([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    expect(rising?.trend).toBe("increasing");
    expect(rising?.pValue).toBeLessThan(0.05);
    expect(rising?.tau).toBeCloseTo(1, 5);
  });

  it("Mann–Kendall ما بيعلنش اتجاه من ضوضاء", () => {
    const noisy = mannKendall(series([5, 4, 6, 5, 6, 4, 5, 6, 5, 4]));
    expect(noisy?.trend).toBe("no_trend");
  });
});

describe("لوحات ضبط العملية", () => {
  it("EWMA بيرصد الانزياح المستمر بعد فترة أساس مستقرة", () => {
    const values = [
      9, 11, 10, 12, 9, 10, 11, 9, 10, 11, 40, 41, 39, 42, 40, 41, 39, 40, 41,
      40,
    ];
    const chart = ewmaControlChart(series(values), {
      baseline: 10,
      lambda: 0.3,
    });
    expect(chart.slice(0, 10).some(point => point.violation)).toBe(false);
    expect(chart.slice(10).some(point => point.violation)).toBe(true);
  });

  it("EWMA بيرجع بدون حدود لو الأساس بلا تباين", () => {
    const chart = ewmaControlChart(series([5, 5, 5]));
    expect(chart.every(point => point.ucl === null)).toBe(true);
  });

  it("CUSUM بيطلع إشارة تحوّل لأعلى", () => {
    const values = [10, 11, 9, 10, 11, 9, 10, 11, 30, 31, 32, 33];
    const points = cusum(series(values), { baseline: 8 });
    expect(points.at(-1)?.signal).toBe("shift_up");
  });
});

describe("الشموع", () => {
  it("يبني OHLC لكل مجموعة أيام", () => {
    const result = candles(series([1, 5, 2, 8, 3, 4]), 3);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      open: 1,
      high: 5,
      low: 1,
      close: 2,
      count: 3,
    });
    expect(result[1]).toMatchObject({ open: 8, high: 8, low: 3, close: 4 });
  });

  it("يتجاهل الأيام الناقصة بدل ما يعتبرها صفر", () => {
    const result = candles(series([10, null, 12]), 2);
    expect(result[0]).toMatchObject({
      open: 10,
      close: 12,
      low: 10,
      high: 12,
      count: 2,
    });
  });
});
