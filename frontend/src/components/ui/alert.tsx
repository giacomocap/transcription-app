import React from 'react';

interface AlertProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'destructive';
}

const Alert = ({ children, className = '', variant = 'default', ...props }: AlertProps) => {
    const variantStyles = {
        default: 'bg-blue-50 text-blue-900 border-blue-200',
        destructive: 'bg-red-50 text-red-900 border-red-200'
    };

    return (
        <div
            role="alert"
            className={`relative w-full rounded-lg border p-4 ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
interface AlertDescriptionProps {
    children: React.ReactNode;
    className?: string;
}

const AlertDescription = ({ className = '', children, ...props }: AlertDescriptionProps) => {
    return (
        <div
            className={`text-sm [&_p]:leading-relaxed ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export { Alert, AlertDescription };