import { describe, expect, it } from "vitest";

import {
  SHEET_HEADERS,
  buildDailyEntryRow,
  buildStudentRow,
  buildThincRow,
  cell,
  dailyEntryRowKey,
  minorToEgp,
} from "./tabs";

describe("صفوف الشيت المجمع", () => {
  it("يكتب الخلية الناقصة فاضية مش صفر", () => {
    expect(cell(null)).toBe("");
    expect(cell(0)).toBe(0);
    expect(minorToEgp(null)).toBe("");
    expect(minorToEgp(0)).toBe(0);
  });

  it("يحوّل القروش لجنيه بمنزلتين", () => {
    expect(minorToEgp(123_45)).toBe(123.45);
  });

  it("طول صف الإدخال اليومي مطابق لعدد الأعمدة", () => {
    const row = buildDailyEntryRow({
      studentId: 7,
      studentName: "محمد",
      entryDate: "2026-08-20",
      ordersPlaced: 10,
      ordersConfirmed: null,
      ordersDelivered: 8,
      ordersReturned: 1,
      collectedRevenueMinor: 440_00,
      productCostMinor: 200_00,
      adSpendMinor: null,
      shippingMinor: 48_00,
      collectionFeesMinor: 8_00,
      returnCostMinor: 10_00,
      variableOpsMinor: 20_00,
      leadsCount: 40,
      sessionsCount: null,
      contributionMarginMinor: null,
      source: "student",
      notes: null,
      updatedAt: "2026-08-20T18:00:00.000Z",
    });

    expect(row).toHaveLength(SHEET_HEADERS.dailyEntries.length);
    expect(row[0]).toBe(dailyEntryRowKey(7, "2026-08-20"));
    expect(row[SHEET_HEADERS.dailyEntries.indexOf("مصروف الإعلان")]).toBe("");
    expect(
      row[SHEET_HEADERS.dailyEntries.indexOf("ربح المساهمة المسلَّم")]
    ).toBe("");
  });

  it("المفتاح ثابت لنفس الطالب واليوم عشان الـupsert يبقى آمن للتكرار", () => {
    expect(dailyEntryRowKey(3, "2026-08-01")).toBe(
      dailyEntryRowKey(3, "2026-08-01")
    );
    expect(dailyEntryRowKey(3, "2026-08-01")).not.toBe(
      dailyEntryRowKey(4, "2026-08-01")
    );
  });

  it("صفوف الطالب وTHINC مطابقة لعناوينها", () => {
    const student = buildStudentRow({
      id: 1,
      fullName: "سارة",
      phone: null,
      email: null,
      cohort: "دفعة 5",
      storeName: null,
      market: "EG",
      status: "active",
      joinedAt: "2026-07-01",
      updatedAt: "2026-08-20T10:00:00.000Z",
    });
    expect(student).toHaveLength(SHEET_HEADERS.students.length);

    const thinc = buildThincRow({
      id: 9,
      studentId: 1,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-20",
      decision: "TEST",
      dataQuality: "OK",
      uncertainty: "MEDIUM",
      failedGates: ["SAMPLE_SIZE"],
      notEvaluableGates: ["COMPLIANCE"],
      decisionReasons: ["سبب"],
      modelVersion: "v5-research-preview",
      evidenceAsOf: null,
      reviewStatus: "draft",
      generatedAt: "2026-08-20T10:00:00.000Z",
    });
    expect(thinc).toHaveLength(SHEET_HEADERS.thinc.length);
    expect(thinc[SHEET_HEADERS.thinc.indexOf("تاريخ الدليل")]).toBe("");
  });
});
