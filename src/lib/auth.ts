import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
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
  plugins: [username()],
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "student" },
      faculty: { type: "string", required: false },
      department: { type: "string", required: false },
    },
  },
});
