import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostSubmitWhatsAppAction } from "@/components/PostSubmitWhatsAppAction";

type LeadSuccessHandoffProps = {
  firstName: string;
  phone: string;
  whatsappUrl: string | null;
  onWhatsAppClick: () => void;
  onDownload: () => void;
};

export function LeadSuccessHandoff({
  firstName,
  phone,
  whatsappUrl,
  onWhatsAppClick,
  onDownload,
}: LeadSuccessHandoffProps) {
  return (
    <>
      <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
        شكراً ليك {firstName} 🎉
      </h3>
      <p className="text-white/60 text-lg mb-4 leading-relaxed">
        استلمنا بياناتك وبنجهّزلك خطة عملية مخصصة.
      </p>
      <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: "#141414" }}>
        <p className="text-white/80 text-sm leading-relaxed">
          📩 هنتواصل معاك على <span className="font-bold" style={{ color: "#EA8A1E" }}>{phone || "واتساب"}</span> خلال 24 ساعة
          <br />
          <span className="text-white/50 text-xs">عايز تبدأ فوراً؟ كلمنا دلوقتي على واتساب</span>
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <PostSubmitWhatsAppAction whatsappUrl={whatsappUrl} onWhatsAppClick={onWhatsAppClick} />
        <Button
          size="lg"
          onClick={onDownload}
          className="text-white text-base px-6 py-5 font-bold border w-full sm:w-auto"
          style={{ backgroundColor: "transparent", borderColor: "rgba(234,138,30,0.31)" }}
        >
          <Download className="w-4 h-4 ml-2" />
          حمّل نسخة PDF
        </Button>
      </div>
    </>
  );
}
