import { useState, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  showPasswordToggle?: boolean;
}

export default function Input({
  className = "",
  showPasswordToggle = false,
  type,
  ...props
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordInput = type === "password" && showPasswordToggle;

  if (!isPasswordInput) {
    return (
      <input
        {...props}
        type={type}
        className={[
          "h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-text shadow-[inset_0_1px_1px_rgba(20,35,22,0.025)]",
          "placeholder:text-text-muted/80 focus:border-primary focus:outline-none",
          "focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        ].join(" ")}
      />
    );
  }

  return (
    <span className="relative block">
      <input
        {...props}
        type={isPasswordVisible ? "text" : "password"}
        className={[
          "h-11 w-full rounded-xl border border-border bg-card px-3.5 pr-11 text-sm text-text shadow-[inset_0_1px_1px_rgba(20,35,22,0.025)]",
          "placeholder:text-text-muted/80 focus:border-primary focus:outline-none",
          "focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        ].join(" ")}
      />
      <button
        type="button"
        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
        aria-pressed={isPasswordVisible}
        onClick={() => setIsPasswordVisible((visible) => !visible)}
        className="absolute inset-y-1 right-1 flex w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-hover hover:text-text focus-visible:text-text disabled:cursor-not-allowed"
        disabled={props.disabled}
      >
        <i
          className={`fi ${isPasswordVisible ? "fi-rr-eye-crossed" : "fi-rr-eye"}`}
          aria-hidden="true"
        />
      </button>
    </span>
  );
}
