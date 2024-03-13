import { initDoItPlz } from "@do-it-plz/next";
import * as z from "zod";

const catFactSchema = z.object({
  fact: z.string(),
  length: z.number(),
});

const dip = initDoItPlz({
  events: {
    "request cat fact": {},
    "new cat fact": { payload: catFactSchema },
  },
  options: { clientId: "cattitude" },
});

dip.register({
  fetchCatFact: dip.on({ event: "request cat fact" }).doIt(async ({ plz }) => {
    const catFactUrl = await plz(
      "get cat fact url",
      () => "https://catfact.ninja/fact",
    );
    const fact = await plz("fetch cat fact", async () => {
      const response = await fetch(catFactUrl);
      if (response.ok) {
        return await response.json();
      }
    });

    console.log("I really love cat facts");

    const parsedFact = await plz("parse cat fact", async () => {
      return catFactSchema.parse(fact);
    });

    await dip.fireEvent("new cat fact", parsedFact);
  }),
  logCatFact: dip
    .on({ event: "new cat fact" })
    .doIt(async ({ payload, plz }) => {
      const { fact, length } = payload;

      await plz("check cat fact length", () =>
        console.assert(length === fact.length),
      );

      await plz("log cat fact", () => console.log(fact));

      await plz("count number of words", () => {
        const words = fact.split(" ");
        console.log("word count: ", words.length);
      });
    }),
});

export { dip };
