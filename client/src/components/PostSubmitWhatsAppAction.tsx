import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

type PostSubmitWhatsAppActionProps = {
  whatsappUrl: string | null;
  onWhatsAppClick: () => void;
};

export function PostSubmitWhatsAppAction({
  whatsappUrl,
  onWhatsAppClick,
}: PostSubmitWhatsAppActionProps) {
  if (!whatsappUrl) return null;

  return (
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={onWhatsAppClick}>
      <Button size="lg" className="text-white text-lg px-6 py-5 font-bold shadow-xl w-full" style={{ backgroundColor: "#25D366" }}>
        <MessageCircle className="w-5 h-5 ml-2" />
        كلمنا على واتساب
      </Button>
    </a>
  );
}
