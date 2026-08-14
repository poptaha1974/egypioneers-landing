import { useEffect, useMemo, useState } from "react";
import { CalendarClock, LockKeyhole } from "lucide-react";
import { getCountdownParts, getNextWebinarStart } from "@/lib/webinarSchedule";

const TIME_PARTS = [
  { key: "days", label: "يوم" },
  { key: "hours", label: "ساعة" },
  { key: "minutes", label: "دقيقة" },
  { key: "seconds", label: "ثانية" },
] as const;

export function WebinarCountdown() {
  const [now, setNow] = useState(() => new Date());
  const target = useMemo(() => getNextWebinarStart(now), [now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()]);
  const countdown = getCountdownParts(target, now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="rounded-2xl border p-4 md:p-5 mb-6" style={{ backgroundColor: "rgba(234,138,30,0.07)", borderColor: "rgba(234,138,30,0.35)" }}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(234,138,30,0.18)" }}>
          <CalendarClock className="w-5 h-5" style={{ color: "#EA8A1E" }} />
        </div>
        <div>
          <p className="font-bold text-white text-sm md:text-base">الويبنار القادم: الأربعاء، 6:00 مساءً بتوقيت القاهرة</p>
          <p className="text-white/55 text-xs mt-1">أول 30 دقيقة مفتوحة للويبنار، ثم تستكمل الورشة لأعضاء نادي تجار العرب.</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2" aria-label="الوقت المتبقي للويبنار">
        {TIME_PARTS.map(({ key, label }) => (
          <div key={key} className="rounded-xl px-2 py-2.5 text-center" style={{ backgroundColor: "#0A0A0A" }}>
            <p className="font-black text-xl md:text-2xl tabular-nums" style={{ color: "#EA8A1E" }}>{String(countdown[key]).padStart(2, "0")}</p>
            <p className="text-white/45 text-[10px] md:text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-white/45 text-[11px]">
        <LockKeyhole className="w-3.5 h-3.5" />
        التسجيل يضمن لك الدخول لرسالة تفاصيل الويبنار على واتساب.
      </div>
    </div>
  );
}
