import React from 'react';
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";
import Icon, { type IconProps } from '../AppIcon';

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                primary: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline: "border border-input hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                success: "bg-success text-success-foreground hover:bg-success/90",
                warning: "bg-warning text-warning-foreground hover:bg-warning/90",
                danger: "bg-error text-error-foreground hover:bg-error/90",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
                xs: "h-8 rounded-md px-2 text-xs",
                xl: "h-12 rounded-md px-10 text-base",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

type ButtonVariant = "default" | "primary" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning" | "danger";
type ButtonSize = "default" | "sm" | "lg" | "icon" | "xs" | "xl";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    asChild?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    iconName?: IconProps["name"] | null;
    iconPosition?: "left" | "right";
    iconSize?: number | null;
    fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ 
    className,
    variant,
    size,
    asChild = false,
    children,
    loading = false,
    icon,
    iconName = null,
    iconPosition = 'left',
    iconSize = null,
    fullWidth = false,
    disabled = false,
    ...props
}, ref) => {
    const Comp = asChild ? Slot : "button";

    // Icon size mapping based on button size
    const iconSizeMap: Record<ButtonSize, number> = {
        xs: 12,
        sm: 14,
        default: 16,
        lg: 18,
        xl: 20,
        icon: 16,
    };

    const calculatedIconSize = iconSize ?? (size ? iconSizeMap[size] : 16) ?? 16;

    // Loading spinner
    const LoadingSpinner: React.FC = () => (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );

    const renderIcon = (): React.ReactNode => {
        const node = icon ?? (iconName ? (
            <Icon
                name={iconName}
                size={calculatedIconSize}
                className={cn(
                    children && iconPosition === 'left' && "mr-2",
                    children && iconPosition === 'right' && "ml-2"
                )}
            />
        ) : null);
        return node ?? null;
    };

    const renderFallbackButton = (): React.ReactElement => (
        <button
            className={cn(
                buttonVariants({ variant, size, className }),
                fullWidth && "w-full"
            )}
            ref={ref}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <LoadingSpinner />}
            {(icon || iconName) && iconPosition === 'left' && renderIcon()}
            {children}
            {(icon || iconName) && iconPosition === 'right' && renderIcon()}
        </button>
    );

    // When asChild is true, merge icons into the child element
    if (asChild) {
        try {
            if (!children || React.Children?.count(children) !== 1) {
                return renderFallbackButton();
            }

            const child = React.Children?.only(children as React.ReactElement);

            if (!React.isValidElement(child)) {
                return renderFallbackButton();
            }
            const content = (
                <>
                    {loading && <LoadingSpinner />}
                    {(icon || iconName) && iconPosition === 'left' && renderIcon()}
                    {(child as React.ReactElement<any>)?.props?.children}
                    {(icon || iconName) && iconPosition === 'right' && renderIcon()}
                </>
            );

            const childEl = child as React.ReactElement<any>;
            const clonedChild = React.cloneElement(childEl as React.ReactElement<any>, {
                ...(childEl.props as any),
                className: cn(
                    buttonVariants({ variant, size, className }),
                    fullWidth && "w-full",
                    (childEl.props as any)?.className
                ),
                disabled: disabled || loading || (childEl.props as any)?.disabled,
                children: content,
            } as any);

            return <Comp ref={ref as any} {...props}>{clonedChild}</Comp>;
        } catch {
            return renderFallbackButton();
        }
    }

    return (
        <Comp
            className={cn(
                buttonVariants({ variant, size, className }),
                fullWidth && "w-full"
            )}
            ref={ref as any}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <LoadingSpinner />}
            {(icon || iconName) && iconPosition === 'left' && renderIcon()}
            {children}
            {(icon || iconName) && iconPosition === 'right' && renderIcon()}
        </Comp>
    );
});

Button.displayName = "Button";
export default Button;