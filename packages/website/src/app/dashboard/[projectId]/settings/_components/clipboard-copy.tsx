"use client";

import { Button } from "@/components/ui/button";
import { Clipboard } from "lucide-react";
import { toast } from "sonner";

type Props = {
  text: string;
  successMessage?: string;
  errorMessage?: string;
};
export const ClipboardCopy = ({
  text,
  successMessage = "Copied to clipboard",
  errorMessage = "Failed to copy to clipboard",
}: Props) => (
  <Button
    type="button"
    size="sm"
    variant="outline"
    className="text-xs"
    onClick={() => {
      navigator.clipboard
        .writeText(text)
        .then(() => toast.success(successMessage))
        .catch(() => toast.error(errorMessage));
    }}
  >
    Copy to clipboard <Clipboard className="ml-2 h-4 w-4" />
  </Button>
);
