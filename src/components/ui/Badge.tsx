import { cn } from "~/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "primary" | "secondary" | "gradient";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  dot?: boolean;
}

export function Badge({
  variant = "default",
  size = "md",
  className,
  children,
  dot = false,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600",
    success: "bg-gradient-to-r from-success-100 to-success-200 dark:from-success-900/30 dark:to-success-800/30 text-success-800 dark:text-success-200 border border-success-300 dark:border-success-700",
    warning: "bg-gradient-to-r from-warning-100 to-warning-200 dark:from-warning-900/30 dark:to-warning-800/30 text-warning-800 dark:text-warning-200 border border-warning-300 dark:border-warning-700",
    danger: "bg-gradient-to-r from-accent-100 to-accent-200 dark:from-accent-900/30 dark:to-accent-800/30 text-accent-800 dark:text-accent-200 border border-accent-300 dark:border-accent-700",
    info: "bg-gradient-to-r from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 text-primary-800 dark:text-primary-200 border border-primary-300 dark:border-primary-700",
    primary: "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-primary-500/30 shadow-lg",
    secondary: "bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-secondary-500/30 shadow-lg",
    gradient: "bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 text-white shadow-lg animate-gradient bg-size-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px] rounded-md",
    md: "px-2.5 py-1 text-xs rounded-lg",
    lg: "px-3 py-1.5 text-sm rounded-xl",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold transition-all duration-300 hover:scale-105",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full mr-1.5",
          variant === "success" && "bg-success-500",
          variant === "warning" && "bg-warning-500",
          variant === "danger" && "bg-accent-500",
          variant === "info" && "bg-primary-500",
          variant === "primary" && "bg-white",
          variant === "secondary" && "bg-white",
          variant === "default" && "bg-gray-500",
          "animate-pulse"
        )} />
      )}
      {children}
    </span>
  );
}
