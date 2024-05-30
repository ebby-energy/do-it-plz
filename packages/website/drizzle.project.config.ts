import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schemas/project.ts",
  dialect: "sqlite",
  driver: "turso",
  dbCredentials: {
    url: process.env.PROJECT_DATABASE_URL!,
    authToken: process.env.PROJECT_DATABASE_AUTH_TOKEN!,
  },
} satisfies Config;
