import { FormEvent, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildDraftRegistrationPayload,
  createDraftRegistrationEventId,
  DRAFT_ATTRIBUTION_TEST_WEBHOOK_URL,
  getOrCreateDraftVisitorSessionId,
} from "@/lib/campaignDelivery.v2.draft";

const TEST_SOURCE_URL = "https://preview.test/?utm_source=meta&utm_medium=paid_social&utm_campaign=test&utm_content=test_map&utm_id=test-utm-id&fbclid=test123";
const INITIAL_TEST_REGISTRATION_EVENT_ID = "registration_test_utm_dedup_v2_001";
const INITIAL_TEST_VISITOR_SESSION_ID = "draft_session_test_utm_dedup_v2_001";

export default function DraftAttributionTest() {
  const [registrationEventId, setRegistrationEventId] = useState(INITIAL_TEST_REGISTRATION_EVENT_ID);
  const visitorSessionId = useMemo(() => getOrCreateDraftVisitorSessionId(INITIAL_TEST_VISITOR_SESSION_ID), []);
  const [listenerConfirmed, setListenerConfirmed] = useState(false);
  const [result, setResult] = useState<string>("لم يتم الإرسال. الصفحة لا تتصل بالإنتاج أو CAPI.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const payload = useMemo(() => buildDraftRegistrationPayload({
    name: "TEST_UTM_LEAD",
    phone: "01000000000",
    email: "test.utmdedup@example.com",
    registrationEventId,
    visitorSessionId,
    sourceUrl: TEST_SOURCE_URL,
  }), [registrationEventId, visitorSessionId]);

  const submitDraft = async (event: FormEvent) => {
    event.preventDefault();
    if (!listenerConfirmed) {
      setResult("فعّل Listen for test event داخل Workflow الـ Draft أولاً، ثم أكد المربع قبل الإرسال.");
      return;
    }

    setIsSubmitting(true);
    setResult("جارٍ الإرسال إلى webhook-test فقط…");
    try {
      const response = await fetch(DRAFT_ATTRIBUTION_TEST_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseText = await response.text();
      setResult(response.ok
        ? `نجح الإرسال التجريبي (${response.status}). راجع Test Sheet وEvent Log فقط. الرد: ${responseText || "بدون نص"}`
        : `فشل webhook-test (${response.status}). لا توجد أي محاولة بديلة أو اتصال بالإنتاج. الرد: ${responseText || "بدون نص"}`);
    } catch (error) {
      setResult(`تعذر الوصول إلى webhook-test. لا توجد آثار جانبية. السبب: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDraftEvent = () => {
    setRegistrationEventId(createDraftRegistrationEventId());
    setListenerConfirmed(false);
    setResult("تم إنشاء registration_event_id جديد. استخدمه لسيناريو اختبار جديد فقط؛ الضغط المتكرر قبل Reset يعيد استخدام المعرّف نفسه.");
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#0a0a0a] text-white px-4 py-10">
      <section className="mx-auto max-w-3xl space-y-6">
        <Badge className="bg-amber-500/15 text-amber-300 border border-amber-400/30">DRAFT / TEST ONLY — لا يتصل بالإنتاج</Badge>
        <div>
          <h1 className="text-3xl font-black">معمل اختبار UTM والتكرار</h1>
          <p className="mt-3 text-white/70 leading-7">هذه الصفحة مستقلة عن نموذج الويبنار. لا تستدعي tRPC أو FunnelFast أو Pixel أو WhatsApp أو CAPI. سترسل فقط إلى <code className="text-amber-300">webhook-test</code> بعد تأكيد أن المستمع مفعل.</p>
        </div>

        <Card className="bg-white/5 border-white/10 p-5 space-y-3 text-sm">
          <p><strong>Test webhook:</strong> <span className="break-all text-amber-300">{DRAFT_ATTRIBUTION_TEST_WEBHOOK_URL}</span></p>
          <p><strong>registration_event_id:</strong> <span className="break-all">{registrationEventId}</span></p>
          <p><strong>visitor_session_id:</strong> <span className="break-all">{visitorSessionId}</span></p>
          <p className="text-emerald-300">UTM المتوقع: meta / paid_social / test / test_map. قيمة ad_id ستكون null عمداً.</p>
        </Card>

        <form onSubmit={submitDraft} className="space-y-4">
          <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 cursor-pointer">
            <input type="checkbox" checked={listenerConfirmed} onChange={(event) => setListenerConfirmed(event.target.checked)} className="mt-1" />
            <span>أؤكد أن Workflow الـ Draft غير النشط في n8n في وضع <strong>Listen for test event</strong>. هذا الاختبار يعيد تقرير تحقق فقط، ولا يكتب في CRM أو Google Sheet أو CAPI.</span>
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting} className="bg-amber-500 text-black hover:bg-amber-400">{isSubmitting ? "جارٍ الإرسال…" : "إرسال Payload تجريبي"}</Button>
            <Button type="button" variant="outline" onClick={resetDraftEvent}>بدء سيناريو اختبار جديد</Button>
          </div>
        </form>

        <Card className="bg-slate-950 border-white/10 p-5">
          <h2 className="font-bold mb-2">Payload للمراجعة</h2>
          <pre className="overflow-x-auto text-xs text-slate-200 whitespace-pre-wrap">{JSON.stringify(payload, null, 2)}</pre>
        </Card>

        <Card className="bg-white/5 border-white/10 p-5 text-sm leading-7"><strong>حالة الاختبار:</strong> {result}</Card>
      </section>
    </main>
  );
}
