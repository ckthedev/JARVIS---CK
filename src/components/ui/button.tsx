import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#454545] disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#383838] text-[#F5F5F5] hover:bg-[#454545] border border-[#484848]/40 active:scale-[0.985] shadow-sm",
        secondary:
          "bg-[#252525] text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#2C2C2C] border border-[#303030] active:scale-[0.985]",
        outline:
          "border border-[#303030] bg-[#202020] text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#2C2C2C] hover:border-[#383838] active:scale-[0.985]",
        ghost:
          "text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#2C2C2C] active:scale-[0.985]",
        destructive:
          "bg-[#2A1818] border border-[#502020] text-[#EF4444] hover:bg-[#351C1C] hover:text-[#F87171] active:scale-[0.985]",
        link: "text-[#F5F5F5] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-8 sm:h-9 px-3.5 py-1.5",
        sm: "h-7 sm:h-8 rounded-lg px-2.5 text-xs",
        lg: "h-10 rounded-xl px-5 text-sm",
        icon: "h-8 w-8 p-0 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
