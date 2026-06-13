import crypto from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DATA_API = "https://analyticsdata.googleapis.com/v1beta";

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function privateKey() {
  return process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

function requireEnvironment() {
  const missing = ["GA_PROPERTY_ID", "GA_CLIENT_EMAIL", "GA_PRIVATE_KEY"]
    .filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

async function accessToken() {
  requireEnvironment();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: process.env.GA_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), privateKey()).toString("base64url");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`
    })
  });
  if (!response.ok) throw new Error(`Google authentication failed (${response.status})`);
  return (await response.json()).access_token;
}

export async function runReport(body) {
  const token = await accessToken();
  const response = await fetch(`${DATA_API}/properties/${process.env.GA_PROPERTY_ID}:runReport`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GA4 report failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return response.json();
}

export function rows(report) {
  const dimensionHeaders = report.dimensionHeaders?.map((header) => header.name) || [];
  const metricHeaders = report.metricHeaders?.map((header) => header.name) || [];
  return (report.rows || []).map((row) => Object.fromEntries([
    ...dimensionHeaders.map((name, index) => [name, row.dimensionValues?.[index]?.value || ""]),
    ...metricHeaders.map((name, index) => [name, Number(row.metricValues?.[index]?.value || 0)])
  ]));
}

export function metric(report, name) {
  return rows(report)[0]?.[name] || 0;
}
