/**
 * ألوان وعناصر الرسوم — متحققة بمدقق اللوحة على سطح الثيم الداكن
 * (#0e0a08): نطاق الإضاءة، حد التشبع، فصل عمى الألوان، والتباين.
 *
 * لونين تعريفيين بس عن قصد: أي رسمة فيها أكتر من سلسلتين بتتقسم
 * بدل ما نولّد ألوان جديدة.
 */

/** ألوان هوية السلاسل — بترتيب ثابت ومش بتتبدل مع الفلترة. */
export const SERIES_COLORS = {
  primary: "#da720d",
  secondary: "#00a4c0",
} as const;

/** ألوان الحالة محجوزة للمعنى (كويس/تحذير/خطر) وبتتبعت دايماً مع نص. */
export const STATUS_COLORS = {
  good: "#3eab5e",
  warning: "#c9a227",
  critical: "#d1444f",
} as const;

/** عناصر الخلفية — خفيفة ومتوارية عشان البيانات هي اللي تبان. */
export const CHART_INK = {
  grid: "rgba(150, 142, 130, 0.16)",
  axis: "#968e82",
  limit: "#6f6a62",
  surface: "#0e0a08",
} as const;

export const AXIS_TICK = {
  fill: CHART_INK.axis,
  fontSize: 11,
  fontFamily: "Inter, sans-serif",
};
export const LINE_WIDTH = 2;
export const DOT_SIZE = 8;

export const tooltipStyles = {
  contentStyle: {
    background: "#191512",
    border: "1px solid rgba(150, 142, 130, 0.28)",
    borderRadius: 10,
    fontSize: 12,
    fontFamily: "Cairo, sans-serif",
    direction: "rtl" as const,
    padding: "8px 10px",
  },
  labelStyle: { color: "#f0ece6", fontWeight: 700, marginBottom: 4 },
  itemStyle: { color: "#c9c2b8" },
};

export const MISSING_LABEL = "غير متجمّع";

/** القيم بالقرش — الرسم بيعرض جنيه. */
export const minorToEgp = (minor: number | null): number | null =>
  minor === null ? null : minor / 100;

export const formatEgpAxis = (value: number): string =>
  Math.abs(value) >= 1000
    ? `${(value / 1000).toFixed(1)}k`
    : String(Math.round(value));

/** «١٥ أغسطس» بدل التاريخ الكامل عشان المحور ما يزدحمش. */
export const shortDate = (iso: string): string => {
  const [, month, day] = iso.split("-");
  return `${Number(day)}/${Number(month)}`;
};
