import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const homePath = fileURLToPath(new URL("../client/src/pages/Home.tsx", import.meta.url));

describe("تدفق إكمال تسجيل الويبنار", () => {
  it("ينقل التركيز بين الحقول بعد التحقق ويمنع الخروج المفاجئ من تسجيل غير مكتمل", () => {
    const home = readFileSync(homePath, "utf8");

    expect(home).toContain("const nameFieldRef = useRef<HTMLInputElement>(null)");
    expect(home).toContain("const phoneFieldRef = useRef<HTMLInputElement>(null)");
    expect(home).toContain("const emailFieldRef = useRef<HTMLInputElement>(null)");
    expect(home).toContain("const moveToNextField");
    expect(home).toContain("phoneFieldRef.current?.focus()");
    expect(home).toContain("emailFieldRef.current?.focus()");
    expect(home).toContain('window.addEventListener("beforeunload", warnOnExit)');
    expect(home).toContain("formState === \"idle\" && started && !isFormValid()");
  });
});
