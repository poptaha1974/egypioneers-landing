import { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  History,
  Printer,
  RefreshCw,
} from "lucide-react";

import {
  CandlesChart,
  ContributionChart,
  ControlChart,
  EquityCurveChart,
  RatesChart,
} from "@/components/dashboard/Charts";
import {
  DailyEntryForm,
  type DailyValues,
} from "@/components/dashboard/DailyEntryForm";
import { KpiTiles, type Kpi } from "@/components/dashboard/KpiTiles";
import { ReportTable } from "@/components/dashboard/ReportTable";
import { ThincPanel } from "@/components/dashboard/ThincPanel";
import { PageShell } from "@/components/panel/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { isCollected } from "@shared/student/metrics";

const TITLE = "داشبورد الطالب | أرقامك اليومية وقرار THINC";

const isoToday = (): string => new Date().toISOString().slice(0, 10);
const isoDaysAgo = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoToday());
  const [asOfInput, setAsOfInput] = useState("");
  const [appliedAsOf, setAppliedAsOf] = useState<string | null>(null);
  const [entryDate, setEntryDate] = useState(isoToday());
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    document.title = TITLE;
  }, []);

  const range = useMemo(
    () => ({ from, to, ...(appliedAsOf ? { asOf: appliedAsOf } : {}) }),
    [from, to, appliedAsOf]
  );

  const enabled = Boolean(user);
  const dashboard = trpc.student.dashboard.useQuery(range, { enabled });
  const report = trpc.student.report.useQuery(range, { enabled });
  const dayEntries = trpc.student.entries.useQuery(
    { from: entryDate, to: entryDate },
    { enabled }
  );

  const saveDaily = trpc.student.saveDaily.useMutation({
    onSuccess: () => {
      setSavedAt(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      void utils.student.dashboard.invalidate();
      void utils.student.report.invalidate();
      void utils.student.entries.invalidate();
    },
  });

  const downloadCsv = async () => {
    const file = await utils.client.student.exportCsv.query(range);
    const blob = new Blob([file.content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <PageShell
        badge="داشبورد الطالب"
        title="بنحمّل بياناتك…"
        subtitle="ثانية واحدة."
      >
        <div className="h-40" />
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell
        badge="داشبورد الطالب"
        title="محتاج تسجل دخول الأول"
        subtitle="الداشبورد بيعرض أرقامك إنت بس، فلازم نعرف مين حضرتك."
      >
        <Button
          onClick={() => window.location.assign(getLoginUrl())}
          className="font-bold"
        >
          سجّل الدخول
        </Button>
      </PageShell>
    );
  }

  const data = dashboard.data;
  const metrics = data?.metrics;

  const kpis: Kpi[] = metrics
    ? [
        {
          label: "ربح المساهمة المسلَّم",
          value: metrics.contributionMarginMinor,
          format: "egp",
          tone: "good",
        },
        {
          label: "ربح الأوردر المسلَّم",
          value: metrics.contributionPerDeliveredOrderMinor,
          format: "egp",
          tone: "good",
        },
        { label: "متوسط قيمة الأوردر", value: metrics.aovMinor, format: "egp" },
        {
          label: "تكلفة الأوردر المسلَّم",
          value: metrics.cpaMinor,
          format: "egp",
        },
        { label: "ROAS", value: metrics.roas, format: "ratio" },
        {
          label: "معدل التأكيد",
          value: metrics.confirmationRate,
          format: "pct",
        },
        { label: "معدل التسليم", value: metrics.deliveryRate, format: "pct" },
        {
          label: "معدل المرتجع",
          value: metrics.rtoRate,
          format: "pct",
          tone:
            isCollected(metrics.rtoRate) && metrics.rtoRate > 0.25
              ? "critical"
              : "neutral",
        },
      ]
    : [];

  const currentDay = dayEntries.data?.[0];
  const initialValues: DailyValues = currentDay
    ? {
        ordersPlaced: currentDay.ordersPlaced,
        ordersConfirmed: currentDay.ordersConfirmed,
        ordersDelivered: currentDay.ordersDelivered,
        ordersReturned: currentDay.ordersReturned,
        collectedRevenueMinor: currentDay.collectedRevenueMinor,
        productCostMinor: currentDay.productCostMinor,
        adSpendMinor: currentDay.adSpendMinor,
        shippingMinor: currentDay.shippingMinor,
        collectionFeesMinor: currentDay.collectionFeesMinor,
        returnCostMinor: currentDay.returnCostMinor,
        variableOpsMinor: currentDay.variableOpsMinor,
        leadsCount: currentDay.leadsCount,
        sessionsCount: currentDay.sessionsCount,
      }
    : {};

  return (
    <PageShell
      badge={`أهلاً ${data?.student.fullName ?? user.name ?? ""} 👋`}
      title="أرقامك اليومية — وقرار مبني عليها"
      subtitle="سجّل يومك، شوف اتجاهك، وصدّر تقريرك. بياناتك تخصك إنت بس."
    >
      <section className="no-print mb-4 flex flex-wrap items-end gap-3">
        <div>
          <Label
            htmlFor="range-from"
            className="text-[12px] font-bold text-card-foreground"
          >
            من
          </Label>
          <Input
            id="range-from"
            type="date"
            dir="ltr"
            className="mt-1 w-[160px] text-left"
            value={from}
            onChange={event => setFrom(event.target.value)}
          />
        </div>
        <div>
          <Label
            htmlFor="range-to"
            className="text-[12px] font-bold text-card-foreground"
          >
            إلى
          </Label>
          <Input
            id="range-to"
            type="date"
            dir="ltr"
            className="mt-1 w-[160px] text-left"
            value={to}
            onChange={event => setTo(event.target.value)}
          />
        </div>
        <div>
          <Label
            htmlFor="range-asof"
            className="text-[12px] font-bold text-card-foreground"
          >
            استرجاع بتاريخ
          </Label>
          <Input
            id="range-asof"
            type="date"
            dir="ltr"
            className="mt-1 w-[160px] text-left"
            value={asOfInput}
            onChange={event => setAsOfInput(event.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          className="font-bold"
          onClick={() =>
            setAppliedAsOf(asOfInput.trim() === "" ? null : asOfInput)
          }
        >
          <History className="ml-1 h-4 w-4" />
          {appliedAsOf ? "حدّث الاسترجاع" : "استرجع"}
        </Button>
        {appliedAsOf ? (
          <Button
            variant="ghost"
            className="font-bold"
            onClick={() => {
              setAsOfInput("");
              setAppliedAsOf(null);
            }}
          >
            <RefreshCw className="ml-1 h-4 w-4" />
            ارجع للحالي
          </Button>
        ) : null}

        <div className="ms-auto flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="font-bold"
            onClick={downloadCsv}
          >
            <Download className="ml-1 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="secondary"
            className="font-bold"
            onClick={downloadCsv}
          >
            <FileSpreadsheet className="ml-1 h-4 w-4" />
            إكسل
          </Button>
          <Button
            variant="secondary"
            className="font-bold"
            onClick={() => window.print()}
          >
            <Printer className="ml-1 h-4 w-4" />
            PDF
          </Button>
        </div>
      </section>

      {appliedAsOf ? (
        <div className="no-print mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] leading-5 text-amber-300">
          إنت بتشوف الفترة زي ما كانت معروفة يوم {appliedAsOf} — أي تعديل اتعمل
          بعد كده مش ظاهر هنا.
        </div>
      ) : null}

      <div className="space-y-4">
        <KpiTiles kpis={kpis} />

        <div className="no-print grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
          <DailyEntryForm
            entryDate={entryDate}
            onEntryDateChange={setEntryDate}
            initialValues={initialValues}
            initialNotes={currentDay?.notes ?? ""}
            saving={saveDaily.isPending}
            savedAt={savedAt}
            onSubmit={({ values, notes }) =>
              saveDaily.mutate({ entryDate, values, notes })
            }
          />

          <Card className="gap-0 border-border bg-card p-4">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {data ? (
                <>
                  <ContributionChart
                    daily={data.analytics.series}
                    average={data.analytics.sma7}
                  />
                  <EquityCurveChart points={data.analytics.cumulative} />
                  <ControlChart points={data.analytics.control} />
                  <CandlesChart data={data.analytics.candles} />
                  <div className="xl:col-span-2">
                    <RatesChart
                      bars={[
                        {
                          label: "التأكيد",
                          value: isCollected(metrics!.confirmationRate)
                            ? metrics!.confirmationRate
                            : null,
                        },
                        {
                          label: "التسليم",
                          value: isCollected(metrics!.deliveryRate)
                            ? metrics!.deliveryRate
                            : null,
                        },
                        {
                          label: "المرتجع",
                          value: isCollected(metrics!.rtoRate)
                            ? metrics!.rtoRate
                            : null,
                        },
                      ]}
                    />
                  </div>
                </>
              ) : (
                <p className="text-[12px] text-muted-foreground">
                  بنحمّل الرسوم…
                </p>
              )}
            </div>

            {data?.analytics.mannKendall ? (
              <p className="mt-4 border-t border-border pt-3 text-[11px] leading-5 text-muted-foreground">
                اختبار Mann–Kendall على {data.analytics.mannKendall.n} يوم: τ=
                {data.analytics.mannKendall.tau.toFixed(2)}، p=
                {data.analytics.mannKendall.pValue.toFixed(3)} —{" "}
                {
                  {
                    increasing: "اتجاه صاعد دال",
                    decreasing: "اتجاه هابط دال",
                    no_trend: "مفيش اتجاه دال إحصائياً",
                  }[data.analytics.mannKendall.trend]
                }
                . ده وصف للي حصل، مش تنبؤ باللي جاي.
              </p>
            ) : (
              <p className="mt-4 border-t border-border pt-3 text-[11px] leading-5 text-muted-foreground">
                اختبار الاتجاه محتاج 8 أيام مكتملة على الأقل.
              </p>
            )}
          </Card>
        </div>

        {data ? <ThincPanel result={data.thinc} /> : null}
        {report.data ? <ReportTable report={report.data} /> : null}
      </div>
    </PageShell>
  );
}
