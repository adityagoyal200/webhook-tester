import type { ComponentType } from 'react';
import * as LucideIcons from 'lucide-react';
import { HelpCircle, type LucideProps } from 'lucide-react';

export type IconName = keyof typeof LucideIcons;

export interface IconProps extends Omit<LucideProps, 'size' | 'color' | 'strokeWidth' | 'className'> {
    name: IconName;
    size?: number;
    color?: string;
    className?: string;
    strokeWidth?: number;
}

function Icon({
    name,
    size = 24,
    color = "currentColor",
    className = "",
    strokeWidth = 2,
    ...rest
}: IconProps) {
    const IconComponent = (LucideIcons as unknown as Record<string, ComponentType<LucideProps>>)[name as string];

    if (!IconComponent) {
        return <HelpCircle size={size} color="gray" strokeWidth={strokeWidth} className={className} />;
    }

    return <IconComponent
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        className={className}
        {...rest}
    />;
}
export default Icon;