import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadSuccessHandoff } from "../client/src/components/LeadSuccessHandoff";
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

  it("يرندر شاشة النجاح كاملة مع زر واتساب الصحيح دون إنشاء عميل تجريبي", () => {
    const markup = renderToStaticMarkup(
      createElement(LeadSuccessHandoff, {
        firstName: "إيهاب",
        phone: "01025073479",
        whatsappUrl: getPostSubmitWhatsAppUrl("success"),
        onWhatsAppClick: () => {},
        onDownload: () => {},
      }),
    );

    expect(markup).toContain("شكراً ليك إيهاب");
    expect(markup).toContain("استلمنا بياناتك وبنجهّزلك خطة عملية مخصصة.");
    expect(markup).toContain('href="https://wa.me/15559022738?text=');
    expect(markup).toContain("كلمنا على واتساب");
  });
});
