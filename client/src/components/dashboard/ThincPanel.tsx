import { Card } from "@/components/ui/card";
import { DECISION_LABELS_AR } from "@shared/thinc/decision";
import type { GateStatus, ThincResult } from "@shared/thinc/types";

const DECISION_TONE: Record<string, string> = {
  SCALE: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  TEST: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  FIX: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  RESEARCH: "border-border bg-muted/40 text-muted-foreground",
  HOLD: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  REPOSITION: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  KILL: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

/** الحالة بتتبعت بأيقونة ونص مع اللون — مفيش معنى محمول على اللون لوحده. */
const GATE_BADGE: Record<
  GateStatus,
  { icon: string; label: string; className: string }
> = {
  PASS: {
    icon: "✓",
    label: "عدّت",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  FAIL: {
    icon: "✕",
    label: "سقطت",
    className: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  },
  NOT_EVALUABLE: {
    icon: "◌",
    label: "مش قابلة للتقييم",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  },
  NOT_EVALUATED: {
    icon: "—",
    label: "غير مطلوبة",
    className: "border-border bg-muted/40 text-muted-foreground",
  },
};

const GATE_LABELS_AR: Record<string, string> = {
  COMPLIANCE: "الامتثال",
  LIQUIDITY: "السيولة",
  CONTRIBUTION_MARGIN: "هامش المساهمة",
  DATA_QUALITY: "جودة البيانات",
  SAMPLE_SIZE: "حجم العينة",
  DELIVERED_PROFIT: "الربح المسلَّم",
  EXPERIMENT_PROTOCOL: "بروتوكول التجربة",
  HUMAN_APPROVAL: "الموافقة البشرية",
};

const DATA_QUALITY_AR: Record<string, string> = {
  OK: "سليمة",
  PARTIAL: "جزئية",
  INSUFFICIENT: "غير كافية",
};
const UNCERTAINTY_AR: Record<string, string> = {
  LOW: "منخفض",
  MEDIUM: "متوسط",
  HIGH: "مرتفع",
};

export function ThincPanel({ result }: { result: ThincResult }) {
  return (
    <Card className="gap-0 border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-black text-card-foreground">
            قراءة THINC
          </h2>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            البوابات مستقلة — نجاح واحدة ما بيعوّضش سقوط غيرها، ومفيش درجة كلية.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[12px] font-black ${DECISION_TONE[result.decision] ?? DECISION_TONE.RESEARCH}`}
        >
          {DECISION_LABELS_AR[result.decision]} · {result.decision}
        </span>
      </div>

      <ul className="mt-3 space-y-1.5 text-[12px] leading-6 text-card-foreground">
        {result.decisionReasons.map(reason => (
          <li key={reason} className="flex gap-2">
            <span className="text-muted-foreground">•</span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-right text-[12px]">
          <caption className="sr-only">حالة بوابات THINC</caption>
          <thead>
            <tr className="border-b border-border text-[11px] font-bold text-muted-foreground">
              <th className="py-2 pl-2 font-bold">البوابة</th>
              <th className="py-2 pl-2 font-bold">الحالة</th>
              <th className="py-2 font-bold">السبب</th>
            </tr>
          </thead>
          <tbody>
            {result.gates.map(gate => {
              const badge = GATE_BADGE[gate.status];
              return (
                <tr
                  key={gate.gate}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="py-2 pl-2 font-bold text-card-foreground">
                    {GATE_LABELS_AR[gate.gate] ?? gate.gate}
                  </td>
                  <td className="py-2 pl-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${badge.className}`}
                    >
                      <span aria-hidden="true">{badge.icon}</span>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-2 text-muted-foreground">{gate.reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {result.engines.map(engine => (
          <div
            key={engine.engine}
            className="rounded-lg border border-border bg-muted/20 p-3"
          >
            <span className="text-[11px] font-black text-primary">
              {engine.engine}
            </span>
            <p className="mt-1 text-[12px] leading-5 text-card-foreground">
              {engine.assessment}
            </p>
            {engine.constraints.length > 0 ? (
              <p className="mt-1 text-[11px] leading-5 text-amber-300">
                قيود: {engine.constraints.join(" · ")}
              </p>
            ) : null}
            {engine.missing.length > 0 ? (
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                ناقص: {engine.missing.join("، ")}
              </p>
            ) : null}
            <p className="mt-1 text-[11px] text-muted-foreground">
              عدم اليقين: {UNCERTAINTY_AR[engine.uncertainty]}
            </p>
            {engine.nextExperiment ? (
              <p className="mt-1 text-[11px] leading-5 text-card-foreground">
                أقرب تجربة: {engine.nextExperiment}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {result.missing.length > 0 ? (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <h3 className="text-[12px] font-black text-amber-300">
            بيانات غير متجمّعة
          </h3>
          <ul className="mt-1 space-y-1 text-[11px] leading-5 text-muted-foreground">
            {result.missing.map(item => (
              <li key={`${item.field}`}>
                <span className="font-bold text-card-foreground">
                  {String(item.field)}
                </span>{" "}
                — {item.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <footer className="mt-4 border-t border-border pt-3 text-[10px] leading-5 text-muted-foreground">
        {result.statusDeclaration}
        <br />
        جودة البيانات: {DATA_QUALITY_AR[result.dataQuality]} · عدم اليقين:{" "}
        {UNCERTAINTY_AR[result.uncertainty]} · نسخة النموذج{" "}
        {result.modelVersion} · المخطط {result.schemaVersion} · تاريخ الدليل{" "}
        {result.evidenceAsOf ?? "غير متاح"}
      </footer>
    </Card>
  );
}
