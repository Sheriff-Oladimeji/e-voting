import { describe, it, expect } from "vitest";
import { db } from "./index";
import { election } from "./schema";

describe("db connection", () => {
  it("can query the election table", async () => {
    const rows = await db.select().from(election);
    expect(Array.isArray(rows)).toBe(true);
  });
});
