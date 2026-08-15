import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const homePath = fileURLToPath(new URL("../client/src/pages/Home.tsx", import.meta.url));
const htmlPath = fileURLToPath(new URL("../client/index.html", import.meta.url));

describe("معاينة فيديو Pilot", () => {
  it("تعرض فيديو Cairo داخل صفحة الويبنار مع وصف واضح وتجربة تحكم أصلية", () => {
    const home = readFileSync(homePath, "utf8");

    expect(home).toContain("egypioneers_webinar_pilot_v3_cairo_safe-title_dd1b3f97.mp4");
    expect(home).toContain('id="pilot-preview"');
    expect(home).toContain("controls");
    expect(home).toContain('fontFamily: "Cairo, sans-serif"');
    expect(home).toContain("تجربة متدرب بموافقته الصريحة");
  });

  it("يحمّل خط Cairo بأوزانه العربية من وثيقة الصفحة", () => {
    const html = readFileSync(htmlPath, "utf8");

    expect(html).toContain("family=Cairo:wght@400;500;600;700;800;900");
  });
});
