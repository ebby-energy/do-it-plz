import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const statuses = [
  "unactioned",
  "pending",
  "waiting",
  "success",
  "error",
] as const;

export const events = sqliteTable("events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  taskNames: text("task_names", { mode: "json" }).$type<Array<string>>(),
  projectId: text("project_id").notNull(),
  origin: text("origin"),
  payload: blob("payload", { mode: "buffer" }).notNull(),
  iv: blob("iv", { mode: "buffer" }).notNull(),
  metadata: text("metadata", { mode: "json" }).$type<{
    clientId: string;
    clientName: string;
    clientVersion: string;
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const tasks = sqliteTable("tasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  eventId: text("event_id")
    .references(() => events.id)
    .notNull(),
  projectId: text("project_id").notNull(),
  origin: text("origin").notNull(),
  status: text("status", { enum: statuses }).notNull(),
  complete: integer("complete", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** aka "plz"s */
export const subtasks = sqliteTable("subtasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  taskId: text("task_id")
    .references(() => tasks.id)
    .notNull(),
  status: text("status", { enum: statuses }).notNull(),
  stack: blob("stack", { mode: "buffer" }).notNull(),
  iv: blob("iv", { mode: "buffer" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
