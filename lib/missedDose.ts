import { prisma } from "@/lib/db";
import { pushToUser, type PushPayload } from "@/lib/push";

// Missed-dose detection (场景 D/E: 家属代管父母的漏服提醒). Compares each
// medication's scheduled slots against today's MobileDoseLog rows and flags any
// slot that is past a grace window with no logged dose. For managed/member
// profiles the alert fans out to the profile's caregivers (family owner +
// creating caregiver) as well as the patient's own devices.
//
// Delivery depends on lib/push.ts being APNs-configured; when it isn't, the
// misses are still returned (and logged) so an on-device local notification or
// a dashboard can surface them. This function is stateless — safe to run on any
// schedule; it does not itself mark anything, so repeated runs re-detect the
// same open misses until the dose is logged.

const DEFAULT_GRACE_MINUTES = 30;

export type MissedDose = {
  userId: string;
  medicationId: string;
  nameEn: string;
  nameZh: string;
  slot: string; // "08:00"
  day: string; // "2026-09-26"
};

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function slotToMinutes(slot: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(slot.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function parseTimes(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Scan for medication slots that are overdue (past `graceMinutes`) with no dose
 * logged today. Uses server-local time for the day/slot comparison — the app
 * writes local day keys, so a per-user timezone would refine this (a documented
 * limitation, not a correctness bug for a same-timezone deployment).
 */
export async function detectMissedDoses(opts?: {
  now?: Date;
  graceMinutes?: number;
}): Promise<MissedDose[]> {
  const now = opts?.now ?? new Date();
  const grace = opts?.graceMinutes ?? DEFAULT_GRACE_MINUTES;
  const day = dayKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const meds = await prisma.mobileMedication.findMany({
    include: { doseLogs: { where: { day } } },
  });

  const missed: MissedDose[] = [];
  for (const med of meds) {
    const logged = new Set(med.doseLogs.map((l) => l.slot));
    for (const slot of parseTimes(med.times)) {
      const mins = slotToMinutes(slot);
      if (mins === null) continue;
      if (mins + grace > nowMinutes) continue; // not yet overdue
      if (logged.has(slot)) continue; // already taken
      missed.push({
        userId: med.userId,
        medicationId: med.id,
        nameEn: med.nameEn,
        nameZh: med.nameZh,
        slot,
        day,
      });
    }
  }
  return missed;
}

// Resolve who should be alerted about a patient's missed dose: the patient's own
// devices plus, when the patient is a managed/member profile, the caregiver who
// created them and the family owner.
async function recipientsFor(userId: string): Promise<string[]> {
  const ids = new Set<string>([userId]); // the patient's own devices, always
  const user = await prisma.mobileUser.findUnique({ where: { id: userId } });
  if (!user) return Array.from(ids);

  // Fan out to caregivers only for login-less "managed" profiles (the caregiver
  // is their steward by design) or when a self-managing user has explicitly
  // opted in to share health alerts with caregivers (PIPL/GDPR consent).
  const isManaged = user.familyRole === "managed" || !!user.managedById;
  if (isManaged || user.shareAlertsWithCaregivers) {
    if (user.managedById) ids.add(user.managedById);
    if (user.familyId) {
      const family = await prisma.family.findUnique({ where: { id: user.familyId } });
      if (family) ids.add(family.ownerId);
    }
  }
  return Array.from(ids);
}

/**
 * Detect open missed doses and dispatch a push to each patient + their
 * caregivers. Returns the detected misses and how many device deliveries
 * succeeded (0 when APNs is unconfigured — the misses are still returned).
 */
export async function sweepMissedDoses(opts?: {
  now?: Date;
  graceMinutes?: number;
}): Promise<{ missed: MissedDose[]; delivered: number }> {
  const missed = await detectMissedDoses(opts);
  let delivered = 0;

  for (const m of missed) {
    // Desensitized alert: the lock-screen body names no drug. The medication is
    // carried in `data` (not displayed) so the app can deep-link and show the
    // name only after the device is unlocked / the app is opened.
    const payload: PushPayload = {
      title: "用药提醒 · Medication reminder",
      body: `有一次用药未记录，请打开应用查看 · A scheduled dose isn't logged — open the app for details`,
      data: {
        kind: "missedDose",
        userId: m.userId,
        medicationId: m.medicationId,
        slot: m.slot,
        day: m.day,
      },
    };
    const recipients = await recipientsFor(m.userId);
    for (const rid of recipients) {
      delivered += await pushToUser(rid, payload);
    }
  }

  return { missed, delivered };
}
