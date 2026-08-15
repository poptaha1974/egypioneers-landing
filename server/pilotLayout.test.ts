import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const scriptPath = "/home/ubuntu/video-pilot/make_pilot.py";

describe("تخطيط عنوان فيديو Pilot", () => {
  it("يتمركز العنوان الجانبي داخل مستطيله بدلاً من منتصف إطار الفيديو بالكامل", () => {
    const script = readFileSync(scriptPath, "utf8");

    expect(script).toContain("def centered_in_box");
    expect(script).toContain("side_title_box = (56, 74, 478, 162)");
    expect(script).toContain("centered_in_box(draw, 'تجربة متدرب', side_title_box");
  });
});
