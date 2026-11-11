import { useId, type ReactNode } from "react";
import { cn } from "@peerbots/core";

export interface FieldGroupProps {
  label?: string;
  icon?: ReactNode;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function FieldGroup({
  label,
  icon,
  description,
  children,
  className,
  id: customId,
}: FieldGroupProps) {
  const generatedId = useId();
  const labelId = customId || `field-group-${generatedId}`;

  return (
    <div
      role="group"
      aria-labelledby={label ? labelId : undefined}
      className={cn("flex flex-col gap-1.5 w-full", className)}
    >
      {label && (
        <span
          id={labelId}
          className="text-sm font-bold leading-6 text-slate-700 flex items-center gap-1"
        >
          {icon && <span className="shrink-0">{icon}</span>}
          {label}
        </span>
      )}
      {children}
      {description && (
        <span className="text-xs text-slate-600">{description}</span>
      )}
    </div>
  );
}
