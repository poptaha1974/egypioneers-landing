import { createSign } from "node:crypto";

import { ENV } from "./_core/env";

/**
 * عميل Google Sheets بحساب خدمة — من غير أي مكتبة خارجية.
 * التوقيع RS256 بـnode:crypto، والتوكن بيتخزن في الذاكرة لحد قرب انتهائه.
 *
 * الاعتماد كله من متغيرات البيئة:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 *   STUDENT_MASTER_SHEET_ID
 * ولازم الشيت يتشارك مع إيميل حساب الخدمة بصلاحية تعديل.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_TTL_SECONDS = 3600;
const TOKEN_REFRESH_MARGIN_MS = 60_000;

export type SheetsConfig = {
  clientEmail: string;
  privateKey: string;
  spreadsheetId: string;
};

export function getSheetsConfig(): SheetsConfig | null {
  const clientEmail = ENV.googleServiceAccountEmail;
  const privateKey = ENV.googleServiceAccountPrivateKey;
  const spreadsheetId = ENV.studentMasterSheetId;
  if (!clientEmail || !privateKey || !spreadsheetId) return null;
  return { clientEmail, privateKey, spreadsheetId };
}

const base64Url = (input: string | Buffer): string =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export function buildSignedJwt(config: SheetsConfig, now = Date.now()): string {
  const issuedAt = Math.floor(now / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      iss: config.clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + TOKEN_TTL_SECONDS,
    })
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  signer.end();
  const signature = signer.sign(config.privateKey);

  return `${header}.${claims}.${base64Url(signature)}`;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export function resetSheetsTokenCache(): void {
  cachedToken = null;
}

async function getAccessToken(config: SheetsConfig): Promise<string> {
  if (
    cachedToken &&
    cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()
  ) {
    return cachedToken.value;
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: buildSignedJwt(config),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Google token request failed: ${response.status} ${await response.text()}`
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!payload.access_token)
    throw new Error("Google token response has no access_token");

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? TOKEN_TTL_SECONDS) * 1000,
  };
  return cachedToken.value;
}

async function sheetsFetch<T>(
  config: SheetsConfig,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken(config);
  const response = await fetch(`${SHEETS_API}/${config.spreadsheetId}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Google Sheets ${init.method ?? "GET"} ${path} failed: ${response.status} ${await response.text()}`
    );
  }
  return (await response.json()) as T;
}

const quoteTab = (tabName: string) => `'${tabName.replace(/'/g, "''")}'`;

/** بينشئ التاب لو مش موجود، ويكتب صف العناوين مرة واحدة. */
export async function ensureTab(
  config: SheetsConfig,
  tabName: string,
  headers: string[]
): Promise<void> {
  const spreadsheet = await sheetsFetch<{
    sheets?: Array<{ properties?: { title?: string } }>;
  }>(config, "");
  const exists =
    spreadsheet.sheets?.some(sheet => sheet.properties?.title === tabName) ??
    false;

  if (!exists) {
    await sheetsFetch(config, ":batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: tabName } } }],
      }),
    });
  }

  const firstRow = await sheetsFetch<{ values?: string[][] }>(
    config,
    `/values/${encodeURIComponent(`${quoteTab(tabName)}!1:1`)}`
  );

  if (!firstRow.values || firstRow.values.length === 0) {
    await sheetsFetch(
      config,
      `/values/${encodeURIComponent(`${quoteTab(tabName)}!A1`)}?valueInputOption=RAW`,
      {
        method: "PUT",
        body: JSON.stringify({ values: [headers] }),
      }
    );
  }
}

/**
 * Upsert بمفتاح في العمود A: لو المفتاح موجود بيتحدث صفه، وإلا بيتضاف صف جديد.
 * ده اللي بيخلي إعادة إرسال نفس الجوب آمنة (idempotent).
 */
export async function upsertRow(
  config: SheetsConfig,
  tabName: string,
  headers: string[],
  rowKey: string,
  values: unknown[]
): Promise<{ action: "updated" | "appended"; row: number | null }> {
  await ensureTab(config, tabName, headers);

  const keyColumn = await sheetsFetch<{ values?: string[][] }>(
    config,
    `/values/${encodeURIComponent(`${quoteTab(tabName)}!A:A`)}`
  );

  const rows = keyColumn.values ?? [];
  const index = rows.findIndex(
    (row, position) => position > 0 && row[0] === rowKey
  );

  if (index > 0) {
    const rowNumber = index + 1;
    await sheetsFetch(
      config,
      `/values/${encodeURIComponent(`${quoteTab(tabName)}!A${rowNumber}`)}?valueInputOption=RAW`,
      { method: "PUT", body: JSON.stringify({ values: [values] }) }
    );
    return { action: "updated", row: rowNumber };
  }

  await sheetsFetch(
    config,
    `/values/${encodeURIComponent(`${quoteTab(tabName)}!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: [values] }) }
  );
  return { action: "appended", row: null };
}
