import { AuthSession } from "@ogcio/nextjs-auth/auth-session";
import { getSignInConfiguration } from "../../utils/logto-config";

export async function GET() {
  await AuthSession.login(getSignInConfiguration());
}
