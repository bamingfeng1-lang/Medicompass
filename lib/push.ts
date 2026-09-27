import { prisma } from "@/lib/db";
import http2 from "node:http2";
import { readFile } from "node:fs/promises";
import { importPKCS8, SignJWT } from "jose";

// APNs push delivery. Registration (POST /api/mobile/devices) works today; the
// actual send activates once you provide an APNs auth key:
//   APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID and either
//   APNS_KEY_PATH (path to the .p8) or APNS_KEY (the .p8 contents inline).
// Until those are set this stays a logged no-op so the app builds/runs without
// push configured. Signing uses ES256 over the .p8 (jose, already a dep); the
// transport is Node's built-in http2 — no extra dependency.

export type PushPayload = { title: string; body: string; data?: Record<string, string> };

function configured(): boolean {
  return !!(
    process.env.APNS_KEY_ID &&
    process.env.APNS_TEAM_ID &&
    process.env.APNS_BUNDLE_ID &&
    (process.env.APNS_KEY_PATH || process.env.APNS_KEY)
  );
}

function hostFor(env: string): string {
  return env === "production" ? "api.push.apple.com" : "api.sandbox.push.apple.com";
}

async function loadKeyPem(): Promise<string> {
  if (process.env.APNS_KEY) return process.env.APNS_KEY.replace(/\\n/g, "\n");
  return readFile(process.env.APNS_KEY_PATH as string, "utf8");
}

// APNs provider tokens are valid up to 60 min; Apple rejects tokens refreshed
// more often than every 20 min. Cache and refresh at ~50 min.
let cached: { jwt: string; iat: number } | null = null;

async function providerToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && now - cached.iat < 50 * 60) return cached.jwt;
  const key = await importPKCS8(await loadKeyPem(), "ES256");
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: process.env.APNS_KEY_ID as string })
    .setIssuer(process.env.APNS_TEAM_ID as string)
    .setIssuedAt(now)
    .sign(key);
  cached = { jwt, iat: now };
  return jwt;
}

// Send one alert to a single device token over an HTTP/2 connection. Resolves to
// true on 200; false (and logs) on any APNs rejection or transport error.
function sendOne(
  host: string,
  jwt: string,
  deviceToken: string,
  payload: PushPayload,
): Promise<boolean> {
  return new Promise((resolve) => {
    const client = http2.connect(`https://${host}`);
    client.on("error", (e) => {
      console.warn("[push] connection error:", (e as Error).message);
      resolve(false);
    });
    const body = JSON.stringify({
      aps: { alert: { title: payload.title, body: payload.body }, sound: "default" },
      ...(payload.data ?? {}),
    });
    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": process.env.APNS_BUNDLE_ID as string,
      "apns-push-type": "alert",
      "content-type": "application/json",
    });
    let status = 0;
    let respBody = "";
    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    req.setEncoding("utf8");
    req.on("data", (chunk) => (respBody += chunk));
    req.on("end", () => {
      client.close();
      if (status === 200) return resolve(true);
      console.warn(`[push] APNs ${status} for token …${deviceToken.slice(-6)}: ${respBody}`);
      resolve(false);
    });
    req.on("error", (e) => {
      console.warn("[push] request error:", (e as Error).message);
      client.close();
      resolve(false);
    });
    req.end(body);
  });
}

/**
 * Send a push to every device registered for a user. No-op (logs) until APNs is
 * configured. Returns how many device deliveries succeeded.
 */
export async function pushToUser(userId: string, payload: PushPayload): Promise<number> {
  const devices = await prisma.mobileDevice.findMany({ where: { userId } });
  if (!devices.length) return 0;
  if (!configured()) {
    console.warn(
      `[push] APNs not configured — would send to ${devices.length} device(s): ${payload.title}`,
    );
    return 0;
  }
  const jwt = await providerToken();
  let ok = 0;
  await Promise.all(
    devices.map(async (d) => {
      if (await sendOne(hostFor(d.env), jwt, d.apnsToken, payload)) ok += 1;
    }),
  );
  return ok;
}
