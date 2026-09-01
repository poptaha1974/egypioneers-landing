import { useEffect, useState } from "react";
import { RefreshCw, UploadCloud } from "lucide-react";

import { FunnelChart } from "@/components/dashboard/Charts";
import { PageShell } from "@/components/panel/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CRM_STAGE_LABELS_AR, type CrmStage } from "@shared/crm/labels";
import { isCollected, type Metric } from "@shared/student/metrics";
import { MISSING_LABEL } from "@/lib/chartTheme";

const TITLE = "تقارير ERP | أداء الأكاديمية والطلاب";

const isoToday = (): string => new Date().toISOString().slice(0, 10);
const isoDaysAgo = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

const egp = (value: Metric): string =>
  isCollected(value)
    ? `${Math.round(value / 100).toLocaleString("en-US")} ج.م`
    : MISSING_LABEL;

const count = (value: Metric): string =>
  isCollected(value) ? value.toLocaleString("en-US") : MISSING_LABEL;

const pct = (value: Metric): string =>
  isCollected(value) ? `${(value * 100).toFixed(1)}%` : MISSING_LABEL;

const DATA_QUALITY_AR: Record<string, string> = {
  OK: "سليمة",
  PARTIAL: "جزئية",
  INSUFFICIENT: "غير كافية",
};

export default function ErpReports() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoToday());

  useEffect(() => {
    document.title = TITLE;
  }, []);

  const isAdmin = user?.role === "admin";
  const summary = trpc.erp.summary.useQuery({ from, to }, { enabled: isAdmin });
  const dispatch = trpc.sheets.dispatch.useMutation({
    onSuccess: () => {
      void utils.erp.summary.invalidate();
    },
  });

  if (loading) {
    return (
      <PageShell badge="ERP" title="بنحمّل…" subtitle="ثانية واحدة.">
        <div className="h-40" />
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell
        badge="ERP"
        title="الصفحة دي للإدارة"
        subtitle="محتاج صلاحية إدارة عشان تشوف التقارير دي."
      >
        <div className="h-20" />
      </PageShell>
    );
  }

  const report = summary.data;

  return (
    <PageShell
      badge="تقارير تشغيلية"
      title="الأكاديمية والطلاب — كل خط لوحده"
      subtitle="إيراد الأكاديمية من المدفوعات المؤكدة، وأداء المتاجر من إدخالات الطلاب. مفيش جمع بين الاتنين."
    >
      <section className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <Label
            htmlFor="erp-from"
            className="text-[12px] font-bold text-card-foreground"
          >
            من
          </Label>
          <Input
            id="erp-from"
            type="date"
            dir="ltr"
            className="mt-1 w-[160px] text-left"
            value={from}
            onChange={event => setFrom(event.target.value)}
          />
        </div>
        <div>
          <Label
            htmlFor="erp-to"
            className="text-[12px] font-bold text-card-foreground"
          >
            إلى
          </Label>
          <Input
            id="erp-to"
            type="date"
            dir="ltr"
            className="mt-1 w-[160px] text-left"
            value={to}
            onChange={event => setTo(event.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          className="font-bold"
          onClick={() => void summary.refetch()}
        >
          <RefreshCw className="ml-1 h-4 w-4" />
          حدّث
        </Button>
      </section>

      {report ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="gap-0 border-border bg-card p-3">
              <span className="text-[11px] font-bold text-muted-foreground">
                مدفوعات الأكاديمية
              </span>
              <p
                dir="ltr"
                className="mt-1 text-right text-[19px] font-black text-card-foreground"
              >
                {Math.round(report.academy.collectedMinor / 100).toLocaleString(
                  "en-US"
                )}{" "}
                {report.academy.currency ?? "ج.م"}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {report.academy.paidCount} عملية مؤكدة
              </p>
            </Card>
            <Card className="gap-0 border-border bg-card p-3">
              <span className="text-[11px] font-bold text-muted-foreground">
                مرتجعات
              </span>
              <p
                dir="ltr"
                className="mt-1 text-right text-[19px] font-black text-card-foreground"
              >
                {report.academy.refundedCount}
              </p>
            </Card>
            <Card className="gap-0 border-border bg-card p-3">
              <span className="text-[11px] font-bold text-muted-foreground">
                طلاب سجّلوا أرقامهم
              </span>
              <p
                dir="ltr"
                className="mt-1 text-right text-[19px] font-black text-card-foreground"
              >
                {report.coverage.studentsWithAnyEntry} /{" "}
                {report.coverage.studentsTotal}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {report.coverage.fullyMissing} ربحهم غير قابل للحساب
              </p>
            </Card>
            <Card className="gap-0 border-border bg-card p-3">
              <span className="text-[11px] font-bold text-muted-foreground">
                طابور الشيت المجمع
              </span>
              <p
                dir="ltr"
                className="mt-1 text-right text-[19px] font-black text-card-foreground"
              >
                {report.sheetSync.pending}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {report.sheetSync.configured
                  ? `${report.sheetSync.failed} فشل نهائي`
                  : "الاعتماد مش متظبط"}
              </p>
              <Button
                variant="secondary"
                className="mt-2 h-7 text-[11px] font-bold"
                disabled={dispatch.isPending || !report.sheetSync.configured}
                onClick={() => dispatch.mutate({ limit: 25 })}
              >
                <UploadCloud className="ml-1 h-3.5 w-3.5" />
                {dispatch.isPending ? "بيزامن…" : "زامن دلوقتي"}
              </Button>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
            <Card className="gap-0 border-border bg-card p-4">
              <h2 className="text-[15px] font-black text-card-foreground">
                أداء متاجر الطلاب
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                الترتيب بربح المساهمة المسلَّم؛ اللي بياناته ناقصة بينزل آخر
                القائمة بدل ما يتحسب صفر.
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-right text-[12px]">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-bold text-muted-foreground">
                      <th className="py-2 pl-3 font-bold">الطالب</th>
                      <th className="py-2 pl-3 font-bold">الدفعة</th>
                      <th className="py-2 pl-3 font-bold">أيام مكتملة</th>
                      <th className="py-2 pl-3 font-bold">جودة البيانات</th>
                      <th className="py-2 pl-3 font-bold">ربح المساهمة</th>
                      <th className="py-2 pl-3 font-bold">إعلان</th>
                      <th className="py-2 pl-3 font-bold">مسلَّم</th>
                      <th className="py-2 font-bold">مرتجع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.students.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-6 text-center text-muted-foreground"
                        >
                          مفيش طلاب مسجّلين لسه
                        </td>
                      </tr>
                    ) : (
                      report.students.map(row => (
                        <tr
                          key={row.studentId}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="py-2 pl-3 font-bold text-card-foreground">
                            {row.fullName}
                          </td>
                          <td className="py-2 pl-3 text-muted-foreground">
                            {row.cohort ?? "—"}
                          </td>
                          <td
                            dir="ltr"
                            className="py-2 pl-3 text-right text-muted-foreground"
                          >
                            {row.daysCovered}/{row.daysTotal}
                          </td>
                          <td className="py-2 pl-3 text-muted-foreground">
                            {DATA_QUALITY_AR[row.dataQuality] ??
                              row.dataQuality}
                          </td>
                          <td
                            dir="ltr"
                            className={`py-2 pl-3 text-right font-black ${isCollected(row.contributionMarginMinor) ? (row.contributionMarginMinor > 0 ? "text-emerald-400" : "text-rose-400") : "text-muted-foreground"}`}
                          >
                            {egp(row.contributionMarginMinor)}
                          </td>
                          <td
                            dir="ltr"
                            className="py-2 pl-3 text-right text-muted-foreground"
                          >
                            {egp(row.adSpendMinor)}
                          </td>
                          <td
                            dir="ltr"
                            className="py-2 pl-3 text-right text-muted-foreground"
                          >
                            {count(row.ordersDelivered)}
                          </td>
                          <td
                            dir="ltr"
                            className="py-2 text-right text-muted-foreground"
                          >
                            {pct(row.rtoRate)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="gap-0 border-border bg-card p-4">
              <FunnelChart
                bars={report.crmFunnel.map(item => ({
                  label: CRM_STAGE_LABELS_AR[item.stage as CrmStage],
                  value: item.count,
                }))}
              />
              <div className="mt-4 border-t border-border pt-3">
                <h3 className="text-[12px] font-black text-card-foreground">
                  الطلاب حسب الحالة
                </h3>
                <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
                  {report.studentsByStatus.map(item => (
                    <li key={item.status} className="flex justify-between">
                      <span>{item.status}</span>
                      <span
                        dir="ltr"
                        className="font-bold text-card-foreground"
                      >
                        {item.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          <p className="text-[10px] leading-5 text-muted-foreground">
            التقرير اتولد {new Date(report.generatedAt).toLocaleString("en-GB")}{" "}
            · الأرقام الناقصة معروضة «{MISSING_LABEL}» ومش متحوّلة لأصفار.
          </p>
        </div>
      ) : (
        <p className="text-[12px] text-muted-foreground">بنحمّل التقرير…</p>
      )}
    </PageShell>
  );
}
