import { useId } from "react";

/** Labelled input with hint and error wiring (aria-invalid/describedby). */
export default function Field({
  label,
  hint,
  error,
  className = "",
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`block min-h-11 w-full rounded-card border bg-paper-raised px-3.5 text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-ink focus:ring-1 focus:ring-ink ${
          error ? "border-danger" : "border-line"
        }`}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
