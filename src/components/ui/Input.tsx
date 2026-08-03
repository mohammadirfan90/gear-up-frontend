"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", invalid, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-secondary/30 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
          invalid && "border-destructive focus-visible:ring-destructive/30",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

interface FieldShellProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  optional?: boolean;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  optional,
}: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center justify-between text-[13px] font-medium text-foreground"
      >
        {label}
        {optional ? (
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            optional
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export { Input };
