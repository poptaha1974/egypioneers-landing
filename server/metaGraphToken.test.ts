import { describe, expect, it } from "vitest";

describe("رمز Meta Graph API", () => {
  it("يتحقق قراءةً فقط من هوية الرمز عبر Graph API", async () => {
    const token = process.env.META_GRAPH_API_ACCESS_TOKEN;

    expect(token).toBeTruthy();

    const response = await fetch("https://graph.facebook.com/v22.0/me?fields=id,name", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok).toBe(true);

    const payload = (await response.json()) as { id?: string };
    expect(payload.id).toBeTruthy();
  }, 15_000);

  it("يملك وصول ads_read إلى حساب الإعلانات المعتمد", async () => {
    const token = process.env.META_GRAPH_API_ACCESS_TOKEN;

    const response = await fetch(
      "https://graph.facebook.com/v22.0/act_1337470373886269?fields=id,name,account_status",
      { headers: { Authorization: `Bearer ${token}` } },
    );

    expect(response.ok).toBe(true);
    const payload = (await response.json()) as { id?: string };
    expect(payload.id).toBe("act_1337470373886269");
  }, 15_000);
});
