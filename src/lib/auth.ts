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
  // Every account technically has a password field (students get an unusable
  // random one on import), so without the role check here a student could
  // use the public /forgot-password page to set a real password for
  // themselves — defeating the OTP-only design even though nothing else in
  // the app accepts that password for a student (requireAdmin()/proxy.ts
  // still block them everywhere it matters). Never send the reset link at
  // all for non-admins, rather than let the token exist unusably.
  emailAndPassword: {
    enabled: true,
    // Every signUpEmail call in this app happens on behalf of someone ELSE
    // (importStudents creating a student account from an admin's Server
    // Action; the one-off db/seed.ts admin bootstrap) — never a real user
    // signing themselves up in a browser. Better Auth's default is to log
    // the browser in as the newly created account, and since nextCookies()
    // writes whatever session cookie the most recent auth.api.* call
    // produced, that meant creating a student silently swapped the ADMIN's
    // session for the new STUDENT's session, bouncing them to /403 on their
    // next click. autoSignIn: false stops signUpEmail from creating a
    // session at all, which is correct for both callers.
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      if ((user as { role?: string }).role !== "admin") return;
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
