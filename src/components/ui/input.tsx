import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 sm:h-9 w-full rounded-lg border border-[#303030] bg-[#181818] px-3 py-1 text-xs sm:text-sm text-[#F5F5F5] placeholder:text-[#737373] transition-colors focus-visible:outline-none focus-visible:border-[#454545] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
