import { cn } from "~/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "glass" | "gradient" | "hover";
  bordered?: boolean;
}

export function Card({ 
  className, 
  children, 
  variant = "default",
  bordered = true,
  ...props 
}: CardProps) {
  const variants = {
    default: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-soft",
    glass: "glass backdrop-blur-xl border-white/20 dark:border-gray-700/50",
    gradient: "bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 dark:from-gray-800 dark:via-primary-900/20 dark:to-secondary-900/20 border-primary-200/50 dark:border-primary-700/50 shadow-soft",
    hover: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer",
  };

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden transition-all duration-300",
        bordered && "border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gradient?: boolean;
}

export function CardHeader({ 
  className, 
  children, 
  gradient = false,
  ...props 
}: CardHeaderProps) {
  return (
    <div 
      className={cn(
        "p-6 pb-4",
        gradient && "bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-accent-500/10",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  gradient?: boolean;
}

export function CardTitle({ 
  className, 
  children, 
  gradient = false,
  ...props 
}: CardTitleProps) {
  return (
    <h3
      className={cn(
        "text-xl font-bold",
        gradient 
          ? "gradient-text-blue" 
          : "text-gray-900 dark:text-white",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function CardDescription({
  className,
  children,
  ...props
}: CardDescriptionProps) {
  return (
    <p 
      className={cn(
        "text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed", 
        className
      )} 
      {...props}
    >
      {children}
    </p>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({ 
  className, 
  children, 
  ...props 
}: CardContentProps) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gradient?: boolean;
}

export function CardFooter({ 
  className, 
  children, 
  gradient = false,
  ...props 
}: CardFooterProps) {
  return (
    <div
      className={cn(
        "px-6 py-4 flex items-center gap-3 border-t border-gray-100 dark:border-gray-700/50",
        gradient && "bg-gradient-to-r from-gray-50/50 via-primary-50/30 to-secondary-50/30 dark:from-gray-800/50 dark:via-primary-900/10 dark:to-secondary-900/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
