import { pgTable, uuid, text, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";

export const electionStatusEnum = pgEnum("election_status", ["draft", "active", "closed"]);

export const election = pgTable("election", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  status: electionStatusEnum("status").notNull().default("draft"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  eligibleFaculties: text("eligible_faculties").array(),
  eligibleDepartments: text("eligible_departments").array(),
});

export const position = pgTable("position", {
  id: uuid("id").primaryKey().defaultRandom(),
  electionId: uuid("election_id").notNull().references(() => election.id),
  title: text("title").notNull(),
});

export const candidate = pgTable("candidate", {
  id: uuid("id").primaryKey().defaultRandom(),
  positionId: uuid("position_id").notNull().references(() => position.id),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  manifesto: text("manifesto"),
});

export const ballot = pgTable(
  "ballot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: text("student_id").notNull(),
    electionId: uuid("election_id").notNull().references(() => election.id),
    positionId: uuid("position_id").notNull().references(() => position.id),
    votedAt: timestamp("voted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.studentId, table.positionId)]
);

export const vote = pgTable("vote", {
  id: uuid("id").primaryKey().defaultRandom(),
  positionId: uuid("position_id").notNull().references(() => position.id),
  candidateId: uuid("candidate_id").notNull().references(() => candidate.id),
  castAt: timestamp("cast_at", { withTimezone: true }).notNull().defaultNow(),
});
