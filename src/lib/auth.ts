import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";
import { sendAccountEmail } from "./email";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAccountEmail({ to: user.email, url, mode: "reset" });
    },
  },
  plugins: [
    username({
      // Matric numbers look like "2022/409799" — Better Auth's default validator
      // (letters/digits/underscore/dot only) rejects the "/" separator.
      usernameValidator: (username) => /^[a-zA-Z0-9/_.-]+$/.test(username),
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
