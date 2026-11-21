import { useId, type ReactNode } from "react";
import { faceCn as cn } from "../helpers/cn";

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
      className={cn("pbf:flex pbf:flex-col pbf:gap-1.5 pbf:w-full", className)}
    >
      {label && (
        <span
          id={labelId}
          className="pbf:text-sm pbf:font-bold pbf:leading-6 pbf:text-slate-700 pbf:flex pbf:items-center pbf:gap-1"
        >
          {icon && <span className="pbf:shrink-0">{icon}</span>}
          {label}
        </span>
      )}
      {children}
      {description && (
        <span className="pbf:text-xs pbf:text-slate-600">{description}</span>
      )}
    </div>
  );
}
