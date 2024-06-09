import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Task } from "@/db/schemas/project";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const badgeVariants = cva("", {
  variants: {
    status: {
      unactioned: "text-foreground",
      pending: "text-yellow-400",
      waiting: "text-slate-400",
      success: "text-green-400",
      error: "text-red-400",
    },
  },
  defaultVariants: {
    status: "unactioned",
  },
});

const descriptionMap = {
  unactioned: "This task should be queued soon",
  pending: "This task is pending",
  waiting: "This task is waiting to continue",
  success: "This task has been completed successfully - yay!",
  error: "This task has failed",
} satisfies Record<Task["status"], string>;

export const StatusBadge = ({ status }: { status: Task["status"] }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="outline" className={cn(badgeVariants({ status }))}>
          {status}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{descriptionMap[status]}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
