"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ClipboardCopy } from "./clipboard-copy";

type Props = {
  text: string;
};
export const SecretToken = ({ text }: Props) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex w-full flex-col justify-between">
      {visible ? (
        <span>{text}</span>
      ) : (
        <div className="flex flex-row items-center">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i}>*</span>
          ))}
        </div>
      )}
      <span className="sr-only">Hidden token</span>
      <div className="flex flex-row items-center justify-between">
        <Button
          size="sm"
          variant="ghost"
          className="ml-2 font-mono text-xs"
          onClick={() => setVisible(!visible)}
        >
          {visible ? "hide" : "show"}
        </Button>
        <ClipboardCopy text={text} successMessage="Copied token to clipboard" />
      </div>
    </div>
  );
};
