"use client";

import * as RadixSwitch from "@radix-ui/react-switch";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { PaidBadge } from "./badge";

/** Liga e desliga. "locked" mostra o selo de recurso pago e não deixa mudar. */
export function Switch({
  label,
  checked,
  onCheckedChange,
  locked = false,
  hideLabel = false,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  locked?: boolean;
  hideLabel?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={locked}
        className={cn(
          "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-pill border border-input",
          "bg-surface-2 transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <RadixSwitch.Thumb
          className={cn(
            "block size-[18px] translate-x-[2px] rounded-pill bg-bg shadow-card transition-transform",
            "data-[state=checked]:translate-x-[18px]",
          )}
        />
      </RadixSwitch.Root>
      <label htmlFor={id} className={cn("text-sm text-fg", hideLabel && "sr-only")}>
        {label}
      </label>
      {locked && <PaidBadge />}
    </div>
  );
}
