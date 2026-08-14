import React from "react";
import { PostSubmitWhatsAppAction } from "@/components/PostSubmitWhatsAppAction";

type LeadSuccessHandoffProps = {
  firstName: string;
  phone: string;
  whatsappUrl: string | null;
  onWhatsAppClick: () => void;
};

export function LeadSuccessHandoff({
  firstName,
  phone,
  whatsappUrl,
  onWhatsAppClick,
}: LeadSuccessHandoffProps) {
  return (
    <>
      <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
        تسجيلك تم يا {firstName} 🎉
      </h3>
      <p className="text-white/60 text-lg mb-4 leading-relaxed">
        بنحوّلك دلوقتي لمحادثة واتساب علشان تكمل خطوتك الجاية مع الفريق.
      </p>
      <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: "#141414" }}>
        <p className="text-white/80 text-sm leading-relaxed">
          📩 لو واتساب ما اتفتحش تلقائياً، اضغط الزر اللي تحت. هنتابع معاك على <span className="font-bold" style={{ color: "#EA8A1E" }}>{phone || "رقمك المسجل"}</span>.
          <br />
          <span className="text-white/50 text-xs">رسالتك الجاهزة هتظهر تلقائياً في المحادثة.</span>
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <PostSubmitWhatsAppAction whatsappUrl={whatsappUrl} onWhatsAppClick={onWhatsAppClick} />
      </div>
    </>
  );
}
