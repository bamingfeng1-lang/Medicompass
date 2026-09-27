import { createHash, randomBytes } from "crypto";

// Invite codes for family joins (FamilyInvite) and doctor-created patient
// onboarding (PatientInvite). Unlike the 6-digit email OTP (bcrypt, looked up by
// email), a redeemer submits ONLY the code with no other key — so we store a
// deterministic sha256 hash that we can query by directly. Codes are 8 chars of
// a high-entropy, human-unambiguous alphabet (no 0/O/1/I).

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function hashInviteCode(code: string): string {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export function generateInviteCode(): { code: string; codeHash: string } {
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return { code, codeHash: hashInviteCode(code) };
}
