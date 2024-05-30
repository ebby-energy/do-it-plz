import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schemas/project";

const client = createClient({
  url: process.env.PROJECT_DATABASE_URL!,
  authToken: process.env.PROJECT_DATABASE_AUTH_TOKEN!,
});

export const db = drizzle(client, { schema });

export const createProjectDB = ({ projectId }: { projectId: string }) => {
  const url = process.env.PROJECT_DATABASE_URL!.replace("project", projectId);
  const client = createClient({
    url,
    authToken: process.env.PROJECT_DATABASE_AUTH_TOKEN!,
  });

  return drizzle(client, { schema });
};
