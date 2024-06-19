import { AxiomRequest, withAxiom } from "next-axiom";

export const POST = withAxiom(async (req: AxiomRequest) => {
  const body = await req.json();

  const { url, payload } = body;

  const { readable, writable } = new TransformStream();

  const log = req.log;

  const writer = writable.getWriter();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error("No reader found");
    }

    const readerPump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            log.info("Stream completed");
            writer.close();
            break;
          }
          const stringValue = new TextDecoder().decode(value);
          log.with({ stringValue }).info("Received value", { stringValue });
          const { status } = JSON.parse(stringValue);
          if (status === "error") {
            log
              .with({ stringValue })
              .error("Error in response", { stringValue });
          }
          await writer.write(value);
        }
      } catch (error) {
        log.with({ error }).error("Stream aborted in readerPump", { error });
        writer.abort(error);
        throw error;
      }
    };
    readerPump();

    return new Response(readable, {
      headers: { "Content-Type": "application/octet-stream" },
    });
  } catch (error) {
    log.with({ error }).error("Error in handleRequest", { error });
    return new Response("Error while processing stream - response!", {
      status: 500,
    });
  }
});
