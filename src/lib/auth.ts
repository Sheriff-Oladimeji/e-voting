import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username, emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";
import { sendAccountEmail, sendOtpEmail } from "./email";
import { isValidUsername } from "./username-format";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  // Admin-only: students never use a password (see the emailOTP plugin below).
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAccountEmail({ to: user.email, url });
    },
  },
  plugins: [
    username({
      usernameValidator: isValidUsername,
    }),
    emailOTP({
      // Students sign in with matric number + email + a one-time code, never a
      // password. disableSignUp is the load-bearing setting here: without it,
      // completing an OTP flow for ANY email address would silently create a
      // brand-new account for it. With it, sign-in only succeeds for accounts
      // that already exist (i.e. students an admin has actually imported) —
      // Better Auth also silently no-ops sending the code to an unknown email
      // rather than revealing whether that address is registered.
      disableSignUp: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type === "sign-in") {
          await sendOtpEmail({ to: email, otp });
        }
      },
    }),
    // Must be last: lets auth.api.* calls made from Server Actions (like
    // src/app/login/actions.ts) write the session cookie via next/headers.
    // Without it, sign-in "succeeds" but no cookie ever reaches the browser.
    nextCookies(),
  ],
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "student" },
      faculty: { type: "string", required: false },
      department: { type: "string", required: false },
    },
  },
});
