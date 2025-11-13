import { type InputHTMLAttributes, forwardRef, type ReactNode } from "react";
import { cn } from "~/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: "default" | "glass" | "filled";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, variant = "default", className, ...props }, ref) => {
    const variants = {
      default: `
        border-2 border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-800 
        focus:border-primary-500 dark:focus:border-primary-400
        text-gray-900 dark:text-white
        placeholder:text-gray-400 dark:placeholder:text-gray-500
      `,
      glass: `
        glass border border-white/20 dark:border-gray-700/50
        text-gray-900 dark:text-white
        placeholder:text-gray-500 dark:placeholder:text-gray-400
        focus:border-primary-400/50
      `,
      filled: `
        border-0 bg-gray-100 dark:bg-gray-700
        text-gray-900 dark:text-white
        placeholder:text-gray-500 dark:placeholder:text-gray-400
        focus:bg-white dark:focus:bg-gray-600
        focus:ring-2 focus:ring-primary-500
      `,
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full px-4 py-3 rounded-xl transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-0",
              leftIcon && "pl-12",
              rightIcon && "pr-12",
              error && "border-accent-500 dark:border-accent-400 focus:ring-accent-500/50",
              variants[variant],
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-accent-600 dark:text-accent-400 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
