import { createRemoteJWKSet, jwtVerify } from "jose";

// Verifies a "Sign in with Apple" identity token (a JWT) against Apple's public
// keys. On success returns the stable user id (`sub`) and, when present on the
// token, the email. See https://developer.apple.com/documentation/sign_in_with_apple
//
// APPLE_CLIENT_ID should be the audience Apple issued the token for — the app's
// bundle id (native) or a Services ID. When unset we skip the audience check so
// local/sandbox testing works; production should set it.

const APPLE_ISSUER = "https://appleid.apple.com";

const jwks = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

export type AppleIdentity = { sub: string; email?: string };

export async function verifyAppleIdentityToken(
  idToken: string,
): Promise<AppleIdentity> {
  const audience = process.env.APPLE_CLIENT_ID || undefined;
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: APPLE_ISSUER,
    ...(audience ? { audience } : {}),
  });
  if (!payload.sub) {
    throw new Error("Apple token missing sub claim");
  }
  const email = typeof payload.email === "string" ? payload.email : undefined;
  return { sub: payload.sub, email };
}
