import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
}

const variantMap: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-zinc-900 text-white",
  success: "bg-emerald-100 text-emerald-900",
  warning: "bg-amber-100 text-amber-900",
  destructive: "bg-rose-100 text-rose-900",
  outline: "border border-zinc-900 text-zinc-900",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantMap[variant],
        className
      )}
      {...props}
    />
  );
}
