import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
                className
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
            {...props}
        />
    );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn("text-sm text-zinc-500 dark:text-zinc-400", className)} {...props} />
    );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function Badge({
    className,
    variant = 'default',
    ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' }) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                {
                    "border-transparent bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900": variant === 'default',
                    "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400": variant === 'success',
                    "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400": variant === 'warning',
                    "border-transparent bg-red-500/15 text-red-700 dark:text-red-400": variant === 'error',
                    "border-zinc-200 text-zinc-900 dark:border-zinc-800 dark:text-zinc-100": variant === 'outline',
                },
                className
            )}
            {...props}
        />
    );
}
