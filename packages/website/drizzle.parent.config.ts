import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schemas/parent.ts",
  dialect: "sqlite",
  driver: "turso",
  dbCredentials: {
    url: process.env.PARENT_DATABASE_URL!,
    authToken: process.env.PARENT_DATABASE_AUTH_TOKEN!,
  },
} satisfies Config;
