import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/auth-schema";

async function seedAdmin() {
  const username = process.env.SEED_ADMIN_USERNAME!;
  const email = process.env.SEED_ADMIN_EMAIL!;
  const password = process.env.SEED_ADMIN_PASSWORD!;

  const [existing] = await db.select().from(user).where(eq(user.username, username));
  if (existing) {
    console.log(`Admin ${username} already exists, skipping.`);
    return;
  }

  await auth.api.signUpEmail({
    body: { email, password, name: "Admin", username },
  });
  await db.update(user).set({ role: "admin" }).where(eq(user.username, username));
  console.log(`Seeded admin: ${username}`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed admin:", err);
    process.exit(1);
  });
