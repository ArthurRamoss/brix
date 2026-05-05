// Field — label + .field input. Forwards extra props to the underlying input
// so caller can wire `value`, `onChange`, `type`, etc. as needed.

import type { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  prefix?: ReactNode;
  inputClassName?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Field({
  label,
  hint,
  prefix,
  inputClassName = "",
  ...inputProps
}: FieldProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {prefix ? (
        <div style={{ position: "relative" }}>
          <span
            className="mono"
            style={{
              position: "absolute",
              left: 16,
              top: 14,
              color: "var(--fg-3)",
              fontSize: 16,
              pointerEvents: "none",
            }}
          >
            {prefix}
          </span>
          <input
            {...inputProps}
            className={`field tnum mono ${inputClassName}`.trim()}
            style={{ paddingLeft: 56, ...(inputProps.style ?? {}) }}
          />
        </div>
      ) : (
        <input
          {...inputProps}
          className={`field ${inputClassName}`.trim()}
        />
      )}
      {hint && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "var(--fg-2)",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
