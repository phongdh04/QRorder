import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gold" | "secondary" | "destructive" | "outline" | "success";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "bg-slate-800 text-slate-200 border border-slate-700",
        variant === "gold" && "bg-amber-500/15 text-amber-400 border border-amber-500/30",
        variant === "secondary" && "bg-slate-700/50 text-slate-300",
        variant === "destructive" && "bg-rose-500/15 text-rose-400 border border-rose-500/30",
        variant === "success" && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        variant === "outline" && "text-slate-300 border border-slate-700",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
