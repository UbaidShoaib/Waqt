import { forwardRef } from "react";

type Variant = "primary" | "brand" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink/90",
  brand: "bg-brand text-brand-fg hover:brightness-95",
  outline: "border border-line bg-paper-raised text-ink hover:border-ink",
  ghost: "text-ink-muted hover:text-ink",
  danger: "border border-danger/40 bg-paper-raised text-danger hover:bg-danger-soft",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 rounded-pill px-3 text-xs",
  md: "min-h-11 rounded-pill px-5 text-sm",
  lg: "min-h-12 rounded-pill px-6 text-base",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});

export default Button;
