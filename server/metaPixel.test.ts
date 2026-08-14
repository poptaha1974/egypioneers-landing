import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const htmlPath = fileURLToPath(new URL("../client/index.html", import.meta.url));

describe("تهيئة Meta Pixel", () => {
  it("تحتوي وثيقة الصفحة على Meta Pixel الأساسي وحدث PageView", () => {
    const html = readFileSync(htmlPath, "utf8");

    expect(html).toContain("connect.facebook.net/en_US/fbevents.js");
    expect(html).toContain("fbq('init', '1604627917208516')");
    expect(html).toContain("fbq('track', 'PageView')");
  });
});
