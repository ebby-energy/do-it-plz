"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

type Props = {
  text: string;
};
export const SecretToken = ({ text }: Props) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex w-full flex-row justify-between pr-4">
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
      <Button
        size="sm"
        variant="ghost"
        className="ml-2 font-mono text-xs"
        onClick={() => setVisible(!visible)}
      >
        {visible ? "hide" : "show"}
      </Button>
    </div>
  );
};
