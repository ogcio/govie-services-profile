import { createHmac } from "node:crypto";

const verifySignatureOrThrow = async ({
  key,
  body,
  signature,
}: { key: string; body: Buffer; signature: string }) => {
  const isSignatureVerified = verifySignature(key, body, signature);
  if (!isSignatureVerified) throw new Error("Signature not verified...");
};

// https://docs.logto.io/docs/recipes/webhooks/securing-your-webhooks/
const verifySignature = (
  signingKey: string,
  rawBody: Buffer,
  expectedSignature: string,
) => {
  const hmac = createHmac("sha256", signingKey);
  hmac.update(rawBody);
  const signature = hmac.digest("hex");
  return signature === expectedSignature;
};

export { verifySignatureOrThrow };
