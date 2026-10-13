import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "gold" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          // Variants
          variant === "default" && "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/80 shadow-sm",
          variant === "gold" && "bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-semibold hover:from-yellow-400 hover:to-amber-400 shadow-md shadow-yellow-500/20 hover:shadow-yellow-500/30",
          variant === "secondary" && "bg-slate-800/80 text-slate-200 hover:bg-slate-700/90 border border-slate-700/50",
          variant === "outline" && "border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-slate-100",
          variant === "ghost" && "hover:bg-slate-800/70 text-slate-300 hover:text-white",
          variant === "destructive" && "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30",
          // Sizes
          size === "default" && "h-11 px-4 py-2",
          size === "sm" && "h-8 rounded-lg px-3 text-xs",
          size === "lg" && "h-12 rounded-xl px-6 text-base font-semibold",
          size === "icon" && "h-10 w-10",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
