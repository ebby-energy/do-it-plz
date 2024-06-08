import { db as parentDB } from "@/db/parent";
import { createProjectDB } from "@/db/project";
import { events, tasks } from "@/db/schemas/project";
import { decrypt } from "@/utils/crypto";
import { withAxiom, type AxiomRequest } from "next-axiom";
import z from "zod";

export const runtime = "edge";

function isTuple<T>(array: T[]): array is [T, ...T[]] {
  return array.length > 0;
}

const schema = z.object({
  body: z.object({
    name: z.string().min(1),
    payload: z.any(),
    iv: z.any(),
    valid: z.boolean(),
    taskNames: z.array(z.string().min(1)).optional(),
  }),
  headers: z.object({
    "x-dip-project-id": z.string().min(1),
    "x-dip-token": z.string().min(1),
    "x-dip-origin": z.string().min(1),
    "x-dip-client-name": z.string().min(1),
    "x-dip-client-version": z.string().min(1),
  }),
});

export const POST = withAxiom(async (req: AxiomRequest) => {
  const body = await req.json();
  const requestHeaders = new Headers(req.headers);
  const headers = {} as Record<string, string>;
  requestHeaders.forEach((value, key) => {
    headers[key] = value;
  });
  const log = req.log;
  log.info("POSTING with data");

  const result = schema.safeParse({ body, headers });

  if (!result.success) {
    const { errors } = result.error;
    log.with({ errors }).error("Could not parse successfully");
    return Response.json({ success: false }, { status: 400 });
  }

  const {
    "x-dip-project-id": projectId,
    "x-dip-token": token,
    "x-dip-origin": origin,
    "x-dip-client-name": clientName,
    "x-dip-client-version": clientVersion,
  } = result.data.headers;

  const org = await parentDB.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.publicId, projectId),
  });

  if (!org) {
    log.with({ headers }).error("Organization not found");
    return Response.json({ success: false }, { status: 400 });
  }

  const storedToken = await decrypt(org.token, process.env.SECRET_KEY!, org.iv);
  if (storedToken !== token) {
    log.with({ headers }).error("Token mismatch");
    return Response.json({ success: false }, { status: 400 });
  }

  const { name, taskNames, payload, iv, valid } = result.data.body;

  try {
    const projectDB = createProjectDB({ projectId: org.publicId });

    const [{ id: eventId }] = await projectDB
      .insert(events)
      .values({
        name,
        taskNames,
        projectId,
        origin,
        payload: Buffer.from(payload),
        iv: Buffer.from(iv),
        valid,
        metadata: { clientName, clientVersion },
      })
      .returning({ id: events.id });

    if (taskNames) {
      const batch = taskNames.map((name) =>
        projectDB.insert(tasks).values({
          name,
          eventId,
          projectId,
          origin,
          status: "unactioned",
          complete: false,
        }),
      );
      if (isTuple(batch)) {
        await projectDB.batch(batch);
      }
    }
    log.info("Event inserted successfully");
    return Response.json({ success: true });
  } catch (error) {
    log.with({ body, headers }).error("Error inserting event");
    if (error instanceof Error) {
      log.error(error.message);
    }
    return Response.json({ success: false }, { status: 500 });
  }
});
