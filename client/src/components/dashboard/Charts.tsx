import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Candle, ControlPoint, Point } from "@shared/student/timeseries";
import {
  AXIS_TICK,
  CHART_INK,
  DOT_SIZE,
  LINE_WIDTH,
  SERIES_COLORS,
  STATUS_COLORS,
  formatEgpAxis,
  minorToEgp,
  shortDate,
  tooltipStyles,
} from "@/lib/chartTheme";

/**
 * قواعد ثابتة في كل الرسوم هنا:
 * محور واحد فقط، شبكة خفيفة بخط مصمت، خطوط 2px، فجوة حقيقية عند اليوم
 * الناقص (مش صفر)، وتلميح عند المرور. وكل رسمة معاها جدول في الصفحة.
 */

type ChartFrameProps = {
  title: string;
  hint?: string;
  legend?: Array<{ label: string; color: string }>;
  children: React.ReactNode;
};

export function ChartFrame({ title, hint, legend, children }: ChartFrameProps) {
  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-black text-card-foreground">
            {title}
          </h3>
          {hint ? (
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
        {legend && legend.length > 1 ? (
          <ul className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {legend.map(item => (
              <li key={item.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-3 rounded-sm"
                  style={{ background: item.color }}
                />
                {item.label}
              </li>
            ))}
          </ul>
        ) : null}
      </figcaption>
      <div dir="ltr" className="h-[240px] w-full">
        {children}
      </div>
    </figure>
  );
}

const gridProps = {
  stroke: CHART_INK.grid,
  strokeDasharray: "0",
  vertical: false,
} as const;

const egpSeries = (points: Point[]) =>
  points.map(point => ({ date: point.date, value: minorToEgp(point.value) }));

export function ContributionChart({
  daily,
  average,
}: {
  daily: Point[];
  average: Point[];
}) {
  const data = egpSeries(daily).map((point, index) => ({
    ...point,
    average: minorToEgp(average[index]?.value ?? null),
  }));

  return (
    <ChartFrame
      title="ربح المساهمة المسلَّم — يومي"
      hint="الفجوة معناها يوم ما اتسجلش، مش يوم بصفر."
      legend={[
        { label: "ربح اليوم", color: SERIES_COLORS.primary },
        { label: "متوسط 7 أيام", color: SERIES_COLORS.secondary },
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
        >
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: CHART_INK.grid }}
            minTickGap={18}
          />
          <YAxis
            tickFormatter={formatEgpAxis}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <ReferenceLine y={0} stroke={CHART_INK.limit} strokeWidth={1} />
          <Tooltip
            {...tooltipStyles}
            formatter={(value: number, name) => [
              `${Math.round(value)} ج.م`,
              name === "value" ? "ربح اليوم" : "متوسط 7 أيام",
            ]}
            labelFormatter={(label: string) => label}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={SERIES_COLORS.primary}
            strokeWidth={LINE_WIDTH}
            dot={false}
            activeDot={{
              r: DOT_SIZE / 2,
              strokeWidth: 2,
              stroke: CHART_INK.surface,
            }}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke={SERIES_COLORS.secondary}
            strokeWidth={LINE_WIDTH}
            dot={false}
            activeDot={{
              r: DOT_SIZE / 2,
              strokeWidth: 2,
              stroke: CHART_INK.surface,
            }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function EquityCurveChart({ points }: { points: Point[] }) {
  const data = egpSeries(points);

  return (
    <ChartFrame
      title="الربح التراكمي"
      hint="رصيد ربح المساهمة من أول الفترة — منحنى واحد، من غير مقارنة."
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
        >
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={SERIES_COLORS.primary}
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor={SERIES_COLORS.primary}
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: CHART_INK.grid }}
            minTickGap={18}
          />
          <YAxis
            tickFormatter={formatEgpAxis}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <ReferenceLine y={0} stroke={CHART_INK.limit} strokeWidth={1} />
          <Tooltip
            {...tooltipStyles}
            formatter={(value: number) => [
              `${Math.round(value)} ج.م`,
              "تراكمي",
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={SERIES_COLORS.primary}
            strokeWidth={LINE_WIDTH}
            fill="url(#equityFill)"
            connectNulls={false}
            isAnimationActive={false}
            activeDot={{
              r: DOT_SIZE / 2,
              strokeWidth: 2,
              stroke: CHART_INK.surface,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function ControlChart({ points }: { points: ControlPoint[] }) {
  const data = points.map(point => ({
    date: point.date,
    ewma: minorToEgp(point.ewma),
    ucl: minorToEgp(point.ucl),
    lcl: minorToEgp(point.lcl),
    // سلسلة منفصلة للتجاوزات عشان النقط تترسم بشكل حتمي فوق الخط.
    violation: point.violation ? minorToEgp(point.ewma) : null,
  }));

  const hasViolation = data.some(point => point.violation !== null);

  const hasLimits = data.some(point => point.ucl !== null);

  return (
    <ChartFrame
      title="لوحة ضبط EWMA"
      hint={
        hasLimits
          ? "الحدود محسوبة من فترة الأساس. تجاوزها إشارة انزياح مستمر — مش تنبؤ."
          : "محتاج أيام أساس متغيرة عشان تتحسب الحدود."
      }
      legend={[
        { label: "EWMA", color: SERIES_COLORS.primary },
        { label: "حدود الضبط", color: CHART_INK.limit },
        ...(hasViolation
          ? [{ label: "تجاوز الحد", color: STATUS_COLORS.critical }]
          : []),
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
        >
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: CHART_INK.grid }}
            minTickGap={18}
          />
          <YAxis
            tickFormatter={formatEgpAxis}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            {...tooltipStyles}
            formatter={(value: number, name) => [
              `${Math.round(value)} ج.م`,
              name === "ewma"
                ? "EWMA"
                : name === "ucl"
                  ? "الحد الأعلى"
                  : name === "lcl"
                    ? "الحد الأدنى"
                    : "تجاوز الحد",
            ]}
          />
          <Line
            dataKey="ucl"
            stroke={CHART_INK.limit}
            strokeWidth={1}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            dataKey="lcl"
            stroke={CHART_INK.limit}
            strokeWidth={1}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            dataKey="ewma"
            stroke={SERIES_COLORS.primary}
            strokeWidth={LINE_WIDTH}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
            activeDot={{
              r: DOT_SIZE / 2,
              strokeWidth: 2,
              stroke: CHART_INK.surface,
            }}
          />
          <Line
            dataKey="violation"
            stroke="none"
            connectNulls={false}
            isAnimationActive={false}
            dot={{
              r: DOT_SIZE / 2,
              fill: STATUS_COLORS.critical,
              stroke: CHART_INK.surface,
              strokeWidth: 2,
            }}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/**
 * شموع أسبوعية بـSVG مباشر — الجسم من الفتح للإقفال والفتيل من الأدنى للأعلى.
 * اللون هنا حالة (صعود/هبوط) ومعاه نص في التلميح، مش هوية سلسلة.
 */
export function CandlesChart({ data }: { data: Candle[] }) {
  if (data.length === 0) {
    return (
      <ChartFrame
        title="شموع أسبوعية للربح"
        hint="محتاج أسبوع مكتمل على الأقل."
      >
        <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
          مفيش بيانات كفاية لبناء الشموع
        </div>
      </ChartFrame>
    );
  }

  const values = data.flatMap(candle => [candle.high, candle.low, 0]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  // إحداثيات بالبكسل مع preserveAspectRatio افتراضي: الشمعة ما تتمططش أفقياً.
  const width = 640;
  const height = 240;
  const padTop = 14;
  const padBottom = 22;
  const padRight = 52;
  const step = (width - padRight) / data.length;
  const bodyWidth = Math.min(step * 0.32, 26);
  const y = (value: number) =>
    ((max - value) / range) * (height - padTop - padBottom) + padTop;
  const egp = (minor: number) =>
    Math.round(minor / 100).toLocaleString("en-US");

  return (
    <ChartFrame
      title="شموع أسبوعية للربح"
      hint="كل شمعة أسبوع: الجسم من ربح أول يوم لآخر يوم، والفتيل أعلى وأدنى يوم."
      legend={[
        { label: "أسبوع صاعد", color: STATUS_COLORS.good },
        { label: "أسبوع هابط", color: STATUS_COLORS.critical },
      ]}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        role="img"
        aria-label="شموع أسبوعية للربح"
      >
        {[max, 0, min].map(value => (
          <g key={`grid-${value}`}>
            <line
              x1={0}
              x2={width - padRight}
              y1={y(value)}
              y2={y(value)}
              stroke={value === 0 ? CHART_INK.limit : CHART_INK.grid}
              strokeWidth={1}
            />
            <text
              x={width - padRight + 6}
              y={y(value) + 4}
              fill={CHART_INK.axis}
              fontSize={11}
              fontFamily="Inter, sans-serif"
            >
              {egp(value)}
            </text>
          </g>
        ))}
        {data.map((candle, index) => {
          const center = index * step + step / 2;
          const rising = candle.close >= candle.open;
          const color = rising ? STATUS_COLORS.good : STATUS_COLORS.critical;
          const top = y(Math.max(candle.open, candle.close));
          const bottom = y(Math.min(candle.open, candle.close));
          return (
            <g key={candle.label}>
              <title>{`${candle.label} · فتح ${egp(candle.open)} · إقفال ${egp(candle.close)} · أعلى ${egp(candle.high)} · أدنى ${egp(candle.low)} ج.م`}</title>
              <line
                x1={center}
                x2={center}
                y1={y(candle.high)}
                y2={y(candle.low)}
                stroke={color}
                strokeWidth={2}
              />
              <rect
                x={center - bodyWidth / 2}
                y={top}
                width={bodyWidth}
                height={Math.max(bottom - top, 2)}
                fill={color}
                rx={2}
                stroke={CHART_INK.surface}
                strokeWidth={2}
              />
              <text
                x={center}
                y={height - 6}
                textAnchor="middle"
                fill={CHART_INK.axis}
                fontSize={10}
                fontFamily="Inter, sans-serif"
              >
                {`W${index + 1}`}
              </text>
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
}

export type RateBar = { label: string; value: number | null };

export function RatesChart({ bars }: { bars: RateBar[] }) {
  const data = bars.map(bar => ({
    label: bar.label,
    value: bar.value === null ? null : bar.value * 100,
  }));

  return (
    <ChartFrame
      title="معدلات التشغيل"
      hint="التأكيد والتسليم والمرتجع — العمود الفاضي معناه بيان غير متجمّع."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
        >
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="label"
            tick={{ ...AXIS_TICK, fontFamily: "Cairo, sans-serif" }}
            tickLine={false}
            axisLine={{ stroke: CHART_INK.grid }}
          />
          <YAxis
            tickFormatter={(value: number) => `${value}%`}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            {...tooltipStyles}
            formatter={(value: number) => [`${value.toFixed(1)}%`, "النسبة"]}
            cursor={{ fill: "rgba(150,142,130,0.08)" }}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
            isAnimationActive={false}
          >
            {data.map(entry => (
              <Cell key={entry.label} fill={SERIES_COLORS.primary} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function FunnelChart({
  bars,
}: {
  bars: Array<{ label: string; value: number }>;
}) {
  return (
    <ChartFrame
      title="قمع الـCRM"
      hint="عدد السجلات في كل مرحلة — لون واحد لأن المراحل على المحور."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={bars}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
        >
          <CartesianGrid stroke={CHART_INK.grid} horizontal={false} />
          <XAxis
            type="number"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ ...AXIS_TICK, fontFamily: "Cairo, sans-serif" }}
            tickLine={false}
            axisLine={{ stroke: CHART_INK.grid }}
            width={86}
          />
          <Tooltip
            {...tooltipStyles}
            formatter={(value: number) => [String(value), "عدد"]}
            cursor={{ fill: "rgba(150,142,130,0.08)" }}
          />
          <Bar
            dataKey="value"
            fill={SERIES_COLORS.primary}
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
