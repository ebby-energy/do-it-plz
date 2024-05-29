import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schemas/parent";

const client = createClient({
  url: process.env.PARENT_DATABASE_URL!,
  authToken: process.env.PARENT_DATABASE_AUTH_TOKEN!,
});

export const db = drizzle(client, { schema });
