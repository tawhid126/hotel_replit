import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "~/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "gradient" | "glass";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center font-semibold 
    rounded-xl transition-all duration-300 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-95 transform hover:shadow-lg
    relative overflow-hidden group
  `;
  
  const variants = {
    primary: `
      bg-gradient-to-r from-primary-500 to-primary-600 
      text-white hover:from-primary-600 hover:to-primary-700 
      focus:ring-primary-500 shadow-primary-500/25 
      hover:shadow-primary-500/50
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0
      before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700
    `,
    secondary: `
      bg-gradient-to-r from-secondary-500 to-secondary-600 
      text-white hover:from-secondary-600 hover:to-secondary-700 
      focus:ring-secondary-500 shadow-secondary-500/25 
      hover:shadow-secondary-500/50
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0
      before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700
    `,
    outline: `
      border-2 border-primary-500 text-primary-600 
      hover:bg-primary-50 dark:hover:bg-primary-900/10 
      focus:ring-primary-500 hover:border-primary-600
      dark:text-primary-400 dark:border-primary-400
    `,
    danger: `
      bg-gradient-to-r from-accent-500 to-accent-600 
      text-white hover:from-accent-600 hover:to-accent-700 
      focus:ring-accent-500 shadow-accent-500/25 
      hover:shadow-accent-500/50
    `,
    ghost: `
      text-gray-700 dark:text-gray-200 
      hover:bg-gray-100 dark:hover:bg-gray-800 
      focus:ring-gray-500
    `,
    gradient: `
      bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 
      bg-size-200 bg-pos-0 hover:bg-pos-100 
      text-white focus:ring-primary-500 
      shadow-lg hover:shadow-2xl
      transition-all duration-500
    `,
    glass: `
      glass text-gray-900 dark:text-white 
      hover:bg-white/80 dark:hover:bg-gray-800/80 
      border border-white/20 dark:border-gray-700/50
      focus:ring-primary-500
    `,
  };

  const sizes = {
    xs: "px-2.5 py-1.5 text-xs",
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
    xl: "px-8 py-4 text-xl",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={cn(
        baseStyles, 
        variants[variant], 
        sizes[size], 
        widthClass,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-3 h-5 w-5" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="relative z-10">Processing...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2 relative z-10">{leftIcon}</span>}
          <span className="relative z-10">{children}</span>
          {rightIcon && <span className="ml-2 relative z-10">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
