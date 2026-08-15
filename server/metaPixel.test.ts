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

  it("لا تعرض بيانات تقييم أو مراجعات غير موثقة داخل البيانات المنظمة", () => {
    const html = readFileSync(htmlPath, "utf8");

    expect(html).not.toContain('"@type": "AggregateRating"');
    expect(html).not.toContain('"ratingCount"');
    expect(html).not.toContain('"ratingValue"');
  });

  it("يحتوي Course JSON-LD على ويبنار أسبوعي صالح بلا Trailing Comma", () => {
    const html = readFileSync(htmlPath, "utf8");
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)];
    const course = scripts.map((script) => JSON.parse(script[1])).find((data) => data["@type"] === "Course");

    expect(course.name).toContain("ويبنار");
    expect(course.hasCourseInstance.courseSchedule.byDay).toBe("Wednesday");
    expect(course.hasCourseInstance.offers.price).toBe("0");
  });
});
