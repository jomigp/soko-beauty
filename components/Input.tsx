import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "./Button";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leadingIcon,
      className,
      containerClassName,
      id,
      ...rest
    },
    ref
  ) => {
    const inputId = id ?? rest.name ?? `input-${Math.random().toString(36).slice(2, 8)}`;
    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="font-label-caps text-label-caps text-on-surface-variant"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-12 w-full rounded-md border bg-surface-container-lowest px-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60",
              "focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary",
              "transition-shadow",
              leadingIcon ? "pl-10" : "",
              error
                ? "border-error focus:border-error focus:ring-error"
                : "border-outline-variant",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...rest}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="font-body-sm text-body-sm text-error"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="font-body-sm text-body-sm text-on-surface-variant"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
