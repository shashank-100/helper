import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-5 items-center whitespace-nowrap rounded px-2 uppercase tracking-wide transition-colors focus:outline-hidden",
  {
    variants: {
      variant: {
        default: "text-foreground bg-secondary",
        dark: "text-primary-foreground bg-primary",
        bright: "text-bright-foreground bg-bright",
        success: "text-success-foreground bg-success",
        "success-light": "text-success bg-success/10",
        destructive: "text-destructive-foreground bg-destructive",
        gray: "text-muted-foreground bg-muted/80",
      },
      size: {
        default: "text-xxs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
