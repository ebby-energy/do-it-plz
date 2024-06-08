import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  blob,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const organizations = sqliteTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    publicId: text("public_id")
      .notNull()
      .$defaultFn(() => `proj_${createId()}`),
    name: text("name").notNull(),
    token: blob("token", { mode: "buffer" }).notNull(),
    iv: blob("iv", { mode: "buffer" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    publicIdIndex: index("organizations_public_id_index").on(table.publicId),
  }),
);
