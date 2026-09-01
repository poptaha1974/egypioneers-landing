import { Card } from "@/components/ui/card";
import { isCollected, type Metric } from "@shared/student/metrics";
import { MISSING_LABEL } from "@/lib/chartTheme";

export type Kpi = {
  label: string;
  value: Metric;
  format: "egp" | "ratio" | "pct" | "count";
  hint?: string;
  tone?: "neutral" | "good" | "critical";
};

const render = (kpi: Kpi): string => {
  if (!isCollected(kpi.value)) return MISSING_LABEL;
  switch (kpi.format) {
    case "egp":
      return `${Math.round(kpi.value / 100).toLocaleString("en-US")} ج.م`;
    case "ratio":
      return kpi.value.toFixed(2);
    case "pct":
      return `${(kpi.value * 100).toFixed(1)}%`;
    default:
      return kpi.value.toLocaleString("en-US");
  }
};

const toneClass = (kpi: Kpi): string => {
  if (!isCollected(kpi.value)) return "text-muted-foreground";
  if (kpi.tone === "good")
    return kpi.value > 0 ? "text-emerald-400" : "text-rose-400";
  if (kpi.tone === "critical") return "text-rose-400";
  return "text-card-foreground";
};

/** أرقام مفردة — الرقم نفسه هو الرسمة، من غير شارت لواحد. */
export function KpiTiles({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {kpis.map(kpi => (
        <Card key={kpi.label} className="gap-0 border-border bg-card p-3">
          <span className="text-[11px] font-bold leading-4 text-muted-foreground">
            {kpi.label}
          </span>
          <p
            dir="ltr"
            className={`mt-1 text-right text-[19px] font-black leading-tight ${toneClass(kpi)}`}
          >
            {render(kpi)}
          </p>
          {kpi.hint ? (
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              {kpi.hint}
            </p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
