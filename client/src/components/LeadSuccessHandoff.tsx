import React from "react";
import { PostSubmitWhatsAppAction } from "@/components/PostSubmitWhatsAppAction";

type LeadSuccessHandoffProps = {
  firstName: string;
  phone: string;
  whatsappUrl: string | null;
  onWhatsAppClick: () => void;
  automationDelivered: boolean | null;
};

export function LeadSuccessHandoff({
  firstName,
  phone,
  whatsappUrl,
  onWhatsAppClick,
  automationDelivered,
}: LeadSuccessHandoffProps) {
  return (
    <>
      <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
        تسجيلك تم يا {firstName} 🎉
      </h3>
      <p className="text-white/60 text-lg mb-4 leading-relaxed">
        بياناتك اتسجلت، وبنحوّلك دلوقتي لمحادثة واتساب علشان تكمل خطوتك الجاية مع الفريق.
      </p>
      {automationDelivered === true && (
        <div className="rounded-xl border p-3.5 mb-4 text-right" style={{ backgroundColor: "rgba(16,185,129,0.10)", borderColor: "rgba(16,185,129,0.35)" }}>
          <p className="text-emerald-200 font-bold text-sm">تم استلام طلبك بنجاح</p>
          <p className="text-white/60 text-xs mt-1">ظهرت بياناتك في مسار المتابعة، وهنفتح واتساب الآن لتأكيد حضورك.</p>
        </div>
      )}
      <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: "#141414" }}>
        <p className="text-white/80 text-sm leading-relaxed">
          📩 لو واتساب ما اتفتحش تلقائياً، اضغط الزر اللي تحت. هنتابع معاك على <span className="font-bold" style={{ color: "#EA8A1E" }}>{phone || "رقمك المسجل"}</span>.
          <br />
          <span className="text-white/50 text-xs">رسالتك الجاهزة هتظهر تلقائياً في المحادثة.</span>
        </p>
      </div>
      {automationDelivered === false && (
        <p className="text-amber-300/90 text-sm mb-5 leading-relaxed">
          تسجيلك محفوظ عندنا، لكن تأكيد المتابعة التلقائي اتأخر. افتح واتساب دلوقتي علشان تضمن وصول تفاصيل الويبنار للفريق مباشرة.
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <PostSubmitWhatsAppAction whatsappUrl={whatsappUrl} onWhatsAppClick={onWhatsAppClick} />
      </div>
    </>
  );
}
