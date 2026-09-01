/**
 * تحليل السلاسل الزمنية لأرقام الطالب — بأدوات إحصائية مستقرة ومعروفة:
 * متوسطات متحركة، انحدار خطي بفاصل ثقة، اختبار Mann–Kendall اللامعلمي للاتجاه،
 * ولوحات ضبط العملية (EWMA و CUSUM) المستعملة في ضبط الجودة الإحصائي.
 *
 * مبدأ THINC رقم 3: دي مقاييس وصفية ورقابية — مش تنبؤ ولا احتمال نجاح.
 * الأيام الناقصة بتفضل null ومش بتتحول لصفر؛ الدوال بتشتغل على القيم المتاحة
 * وبترجع عدد النقاط المستعملة.
 */

export type Point = { date: string; value: number | null };

const collected = (points: Point[]) =>
  points.filter(
    (point): point is { date: string; value: number } => point.value !== null
  );

/** المتوسط المتحرك البسيط. النقطة بترجع null لحد ما تكتمل النافذة. */
export function sma(points: Point[], window: number): Point[] {
  if (window < 1) throw new Error("window must be >= 1");
  const buffer: number[] = [];
  return points.map(point => {
    if (point.value !== null) buffer.push(point.value);
    if (buffer.length > window) buffer.shift();
    if (point.value === null || buffer.length < window)
      return { date: point.date, value: null };
    return {
      date: point.date,
      value: buffer.reduce((a, b) => a + b, 0) / buffer.length,
    };
  });
}

/** المتوسط المتحرك الأسي بمعامل تنعيم alpha = 2 / (span + 1). */
export function ema(points: Point[], span: number): Point[] {
  if (span < 1) throw new Error("span must be >= 1");
  const alpha = 2 / (span + 1);
  let previous: number | null = null;
  return points.map(point => {
    if (point.value === null) return { date: point.date, value: previous };
    previous =
      previous === null
        ? point.value
        : alpha * point.value + (1 - alpha) * previous;
    return { date: point.date, value: previous };
  });
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** الانحراف المعياري للعينة (مقام n − 1). محتاج نقطتين على الأقل. */
export function stdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const average = mean(values) as number;
  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

/** تقلب متحرك — الانحراف المعياري داخل نافذة متحركة. */
export function rollingStdDev(points: Point[], window: number): Point[] {
  const buffer: number[] = [];
  return points.map(point => {
    if (point.value !== null) buffer.push(point.value);
    if (buffer.length > window) buffer.shift();
    const value = buffer.length < Math.min(window, 2) ? null : stdDev(buffer);
    return { date: point.date, value };
  });
}

/** درجة z لكل نقطة بالنسبة لكل القيم المتاحة. */
export function zScores(points: Point[]): Point[] {
  const values = collected(points).map(point => point.value);
  const average = mean(values);
  const deviation = stdDev(values);
  if (average === null || deviation === null || deviation === 0) {
    return points.map(point => ({ date: point.date, value: null }));
  }
  return points.map(point => ({
    date: point.date,
    value: point.value === null ? null : (point.value - average) / deviation,
  }));
}

/** السلسلة التراكمية — أساس قراءة «الرصيد» زي منحنى رأس المال. */
export function cumulative(points: Point[]): Point[] {
  let total = 0;
  let seen = false;
  return points.map(point => {
    if (point.value !== null) {
      total += point.value;
      seen = true;
    }
    return { date: point.date, value: seen ? total : null };
  });
}

export type Drawdown = {
  peak: number;
  trough: number;
  depth: number;
  peakDate: string;
  troughDate: string;
};

/** أقصى تراجع في السلسلة التراكمية. */
export function maxDrawdown(points: Point[]): Drawdown | null {
  const series = collected(cumulative(points));
  if (series.length === 0) return null;

  let peak = series[0];
  let worst: Drawdown | null = null;

  for (const point of series) {
    if (point.value > peak.value) peak = point;
    const depth = peak.value - point.value;
    if (depth > 0 && (worst === null || depth > worst.depth)) {
      worst = {
        peak: peak.value,
        trough: point.value,
        depth,
        peakDate: peak.date,
        troughDate: point.date,
      };
    }
  }

  return worst;
}

export type LinearTrend = {
  slope: number;
  intercept: number;
  slopeStdError: number | null;
  ci95: [number, number] | null;
  r2: number | null;
  n: number;
};

/** انحدار المربعات الصغرى على ترتيب الأيام، مع خطأ معياري وفاصل ثقة 95%. */
export function linearTrend(points: Point[]): LinearTrend | null {
  const series = collected(points);
  const n = series.length;
  if (n < 2) return null;

  const xs = series.map((_, index) => index);
  const ys = series.map(point => point.value);
  const xMean = mean(xs) as number;
  const yMean = mean(ys) as number;

  const sxx = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
  if (sxx === 0) return null;
  const sxy = xs.reduce(
    (sum, x, index) => sum + (x - xMean) * (ys[index] - yMean),
    0
  );

  const slope = sxy / sxx;
  const intercept = yMean - slope * xMean;

  const residualSumSquares = ys.reduce(
    (sum, y, index) => sum + (y - (intercept + slope * xs[index])) ** 2,
    0
  );
  const totalSumSquares = ys.reduce((sum, y) => sum + (y - yMean) ** 2, 0);

  if (n < 3) {
    return { slope, intercept, slopeStdError: null, ci95: null, r2: null, n };
  }

  const slopeStdError = Math.sqrt(residualSumSquares / (n - 2) / sxx);
  const critical = tCritical95(n - 2);
  return {
    slope,
    intercept,
    slopeStdError,
    ci95: [slope - critical * slopeStdError, slope + critical * slopeStdError],
    r2: totalSumSquares === 0 ? null : 1 - residualSumSquares / totalSumSquares,
    n,
  };
}

/** قيم t الحرجة عند 95% ثنائي الطرف لدرجات حرية صغيرة، وتقارب 1.96 بعدها. */
function tCritical95(df: number): number {
  const table: Record<number, number> = {
    1: 12.706,
    2: 4.303,
    3: 3.182,
    4: 2.776,
    5: 2.571,
    6: 2.447,
    7: 2.365,
    8: 2.306,
    9: 2.262,
    10: 2.228,
    12: 2.179,
    15: 2.131,
    20: 2.086,
    25: 2.06,
    30: 2.042,
    40: 2.021,
    60: 2.0,
    120: 1.98,
  };
  if (table[df]) return table[df];
  const keys = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  const next = keys.find(key => key > df);
  return next ? table[next] : 1.96;
}

/** دالة الخطأ — تقريب Abramowitz & Stegun 7.1.26 (خطأ < 1.5e-7). */
function erf(x: number): number {
  const sign = Math.sign(x);
  const absolute = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * absolute);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-absolute * absolute);
  return sign * y;
}

export const normalTwoSidedPValue = (z: number): number =>
  1 - erf(Math.abs(z) / Math.SQRT2);

export type MannKendall = {
  s: number;
  tau: number;
  z: number;
  pValue: number;
  trend: "increasing" | "decreasing" | "no_trend";
  n: number;
};

/**
 * اختبار Mann–Kendall اللامعلمي للاتجاه — ما بيفترضش توزيعاً طبيعياً،
 * وده مناسب لأرقام يومية صغيرة ومتقلبة. يحتاج 8 نقاط على الأقل
 * عشان التقريب الطبيعي يبقى معقول.
 */
export function mannKendall(points: Point[], alpha = 0.05): MannKendall | null {
  const values = collected(points).map(point => point.value);
  const n = values.length;
  if (n < 8) return null;

  let s = 0;
  for (let i = 0; i < n - 1; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      s += Math.sign(values[j] - values[i]);
    }
  }

  const tieGroups = new Map<number, number>();
  for (const value of values)
    tieGroups.set(value, (tieGroups.get(value) ?? 0) + 1);
  const tieCorrection = Array.from(tieGroups.values())
    .filter(count => count > 1)
    .reduce((sum, count) => sum + count * (count - 1) * (2 * count + 5), 0);

  const variance = (n * (n - 1) * (2 * n + 5) - tieCorrection) / 18;
  if (variance <= 0) return null;

  const z =
    s > 0
      ? (s - 1) / Math.sqrt(variance)
      : s < 0
        ? (s + 1) / Math.sqrt(variance)
        : 0;
  const pValue = normalTwoSidedPValue(z);
  const tau = (2 * s) / (n * (n - 1));

  return {
    s,
    tau,
    z,
    pValue,
    trend: pValue > alpha ? "no_trend" : s > 0 ? "increasing" : "decreasing",
    n,
  };
}

export type ControlPoint = {
  date: string;
  value: number | null;
  ewma: number | null;
  ucl: number | null;
  lcl: number | null;
  violation: boolean;
};

/**
 * لوحة ضبط EWMA — بتكشف الانزياحات الصغيرة المستمرة أسرع من لوحة Shewhart.
 * الحدود بتُحسب من متوسط وانحراف فترة الأساس (baseline).
 */
export function ewmaControlChart(
  points: Point[],
  options: { lambda?: number; sigmaLimit?: number; baseline?: number } = {}
): ControlPoint[] {
  const lambda = options.lambda ?? 0.2;
  const sigmaLimit = options.sigmaLimit ?? 3;
  const series = collected(points);
  const baselineCount = Math.min(
    options.baseline ?? Math.max(5, Math.floor(series.length / 3)),
    series.length
  );
  const baselineValues = series
    .slice(0, baselineCount)
    .map(point => point.value);
  const center = mean(baselineValues);
  const sigma = stdDev(baselineValues);

  if (center === null || sigma === null || sigma === 0) {
    return points.map(point => ({
      date: point.date,
      value: point.value,
      ewma: null,
      ucl: null,
      lcl: null,
      violation: false,
    }));
  }

  let previous = center;
  let index = 0;

  return points.map(point => {
    if (point.value === null) {
      return {
        date: point.date,
        value: null,
        ewma: null,
        ucl: null,
        lcl: null,
        violation: false,
      };
    }
    index += 1;
    previous = lambda * point.value + (1 - lambda) * previous;
    const spread =
      sigma *
      Math.sqrt((lambda / (2 - lambda)) * (1 - (1 - lambda) ** (2 * index)));
    const ucl = center + sigmaLimit * spread;
    const lcl = center - sigmaLimit * spread;
    return {
      date: point.date,
      value: point.value,
      ewma: previous,
      ucl,
      lcl,
      violation: previous > ucl || previous < lcl,
    };
  });
}

export type CusumPoint = {
  date: string;
  high: number;
  low: number;
  signal: "none" | "shift_up" | "shift_down";
};

/**
 * CUSUM بالمعيار المرجعي k (بوحدات سيجما) وحد القرار h.
 * بيرصد نقطة تحوّل مستمرة في المتوسط.
 */
export function cusum(
  points: Point[],
  options: { k?: number; h?: number; baseline?: number } = {}
): CusumPoint[] {
  const k = options.k ?? 0.5;
  const h = options.h ?? 5;
  const series = collected(points);
  const baselineCount = Math.min(
    options.baseline ?? Math.max(5, Math.floor(series.length / 3)),
    series.length
  );
  const baselineValues = series
    .slice(0, baselineCount)
    .map(point => point.value);
  const center = mean(baselineValues);
  const sigma = stdDev(baselineValues);

  if (center === null || sigma === null || sigma === 0) return [];

  let high = 0;
  let low = 0;

  return series.map(point => {
    const standardized = (point.value - center) / sigma;
    high = Math.max(0, high + standardized - k);
    low = Math.max(0, low - standardized - k);
    return {
      date: point.date,
      high,
      low,
      signal: high > h ? "shift_up" : low > h ? "shift_down" : "none",
    };
  });
}

export type Candle = {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  count: number;
};

/** شموع OHLC من قيم يومية — للقراءة البصرية السريعة زي شارت البورصة. */
export function candles(points: Point[], bucketSize: number): Candle[] {
  if (bucketSize < 1) throw new Error("bucketSize must be >= 1");
  const series = collected(points);
  const result: Candle[] = [];

  for (let start = 0; start < series.length; start += bucketSize) {
    const bucket = series.slice(start, start + bucketSize);
    if (bucket.length === 0) continue;
    const values = bucket.map(point => point.value);
    result.push({
      label: `${bucket[0].date} → ${bucket[bucket.length - 1].date}`,
      open: values[0],
      close: values[values.length - 1],
      high: Math.max(...values),
      low: Math.min(...values),
      count: bucket.length,
    });
  }

  return result;
}
