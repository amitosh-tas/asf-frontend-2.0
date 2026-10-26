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
          "h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-text shadow-sm",
          "placeholder:text-text-muted focus:border-primary focus:outline-none",
          "focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60",
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
          "h-10 w-full rounded-md border border-border bg-card px-3 pr-10 text-sm text-text shadow-sm",
          "placeholder:text-text-muted focus:border-primary focus:outline-none",
          "focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        ].join(" ")}
      />
      <button
        type="button"
        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
        aria-pressed={isPasswordVisible}
        onClick={() => setIsPasswordVisible((visible) => !visible)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-text-muted transition-colors hover:text-text focus-visible:text-text disabled:cursor-not-allowed"
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
