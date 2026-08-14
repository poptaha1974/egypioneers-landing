import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PostSubmitWhatsAppAction } from "../client/src/components/PostSubmitWhatsAppAction";
import { getPostSubmitWhatsAppUrl, WHATSAPP_URL } from "../client/src/lib/leadHandoff";

describe("تسليم العميل إلى واتساب بعد نجاح النموذج", () => {
  it("يعرض رابط محادثة واتساب فقط بعد نجاح النموذج", () => {
    expect(getPostSubmitWhatsAppUrl("success")).toBe(WHATSAPP_URL);
    expect(getPostSubmitWhatsAppUrl("idle")).toBeNull();
    expect(getPostSubmitWhatsAppUrl("submitting")).toBeNull();
    expect(getPostSubmitWhatsAppUrl("error")).toBeNull();
    expect(WHATSAPP_URL).toMatch(/^https:\/\/wa\.me\/15559022738\?text=/);
  });

  it("يعرض زر واتساب فعلياً في واجهة النجاح دون الحاجة لإرسال نموذج حقيقي", () => {
    const successMarkup = renderToStaticMarkup(
      createElement(PostSubmitWhatsAppAction, {
        whatsappUrl: getPostSubmitWhatsAppUrl("success"),
        onWhatsAppClick: () => {},
      }),
    );
    const idleMarkup = renderToStaticMarkup(
      createElement(PostSubmitWhatsAppAction, {
        whatsappUrl: getPostSubmitWhatsAppUrl("idle"),
        onWhatsAppClick: () => {},
      }),
    );

    expect(successMarkup).toContain('href="https://wa.me/15559022738?text=');
    expect(successMarkup).toContain('target="_blank"');
    expect(successMarkup).toContain("كلمنا على واتساب");
    expect(idleMarkup).toBe("");
  });
});
