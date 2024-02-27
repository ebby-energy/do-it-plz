/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const preferredRegion = "global";

export const alt = "do-it-plz.com";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OGImage() {
  const regular = await fetch(
    new URL("fonts/AtkinsonHyperlegible-Regular.ttf", "https://do-it-plz.com"),
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{ backgroundColor: "hsl(222.2 84% 4.9%)" }}
        tw="flex h-full w-full flex-row items-center justify-center text-8xl"
      >
        <img
          tw="mr-20"
          alt="do-it-plz logo"
          width="256"
          height="256"
          src="https://do-it-plz.com/images/logo.png"
        />
        <div tw="flex flex-col items-center justify-center">
          <p
            tw="mb-0"
            style={{
              color: "hsl(70 100% 50%)",
              fontFamily: "AtkinsonHyperlegible-Bold",
            }}
          >
            do-it-plz.com
          </p>
          <p tw="mb-0 mt-8 text-2xl text-white">
            Managed Task Runner for Serverless Applications
          </p>
          <p tw="my-0 text-2xl text-[#007ACC]">Best with TypeScript 👀</p>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "AtkinsonHyperlegible",
          data: regular,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
