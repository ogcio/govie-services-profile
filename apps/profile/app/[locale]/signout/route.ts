import { AuthSession } from "@ogcio/nextjs-auth/auth-session";
import {
  getSignInConfiguration,
  postSignoutRedirect,
} from "../../utils/logto-config";

export async function GET() {
  await AuthSession.logout(getSignInConfiguration(), postSignoutRedirect);
}
