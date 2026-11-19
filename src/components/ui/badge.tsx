import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#262626] text-[#F5F5F5] border-[#383838]",
        secondary:
          "bg-[#202020] text-[#A3A3A3] border-[#303030]",
        destructive:
          "bg-[#2A1818] text-[#EF4444] border-[#4A2020]",
        warning:
          "bg-[#262626] text-[#D4D4D4] border-[#383838]",
        success:
          "bg-[#242424] text-[#D4D4D4] border-[#383838]",
        outline:
          "text-[#A3A3A3] border-[#303030] bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
