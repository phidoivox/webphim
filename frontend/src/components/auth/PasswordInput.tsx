"use client";

import React, { forwardRef, useState } from "react";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/components/ui/icons";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      id,
      name,
      value,
      onChange,
      placeholder = "Nhập mật khẩu...",
      required = false,
      disabled = false,
      autoComplete = "current-password",
      error,
      className,
      ...props
    },
    ref
  ) {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1">
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-3.5 flex items-center text-white/40">
            <LockIcon className="h-4 w-4" />
          </div>
          <input
            ref={ref}
            id={id || name}
            name={name}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            autoComplete={autoComplete}
            className={`h-11 w-full rounded-xl border bg-white/[0.04] py-2 pl-10 pr-10 text-sm text-ink placeholder:text-muted/50 backdrop-blur-sm transition-all focus:bg-white/[0.08] focus:outline-none ${
              error
                ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-white/10 focus:border-accent focus:ring-1 focus:ring-accent"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className || ""}`}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white/90 transition cursor-pointer"
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        {error && <p className="text-xs font-medium text-red-400 pl-1">{error}</p>}
      </div>
    );
  }
);

export default PasswordInput;

