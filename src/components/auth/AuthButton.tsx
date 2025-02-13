// src/components/AuthButton.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps {
    provider: 'google' | 'apple';
    onClick: () => void;
    loading: boolean;
    children: React.ReactNode;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
    provider,
    onClick,
    loading,
    children
}) => {
    const baseStyles = "w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg font-medium transition duration-200 transform hover:scale-[1.02]";
    const providerStyles = {
        google: "bg-white hover:bg-gray-100 text-gray-800",
        apple: "bg-black hover:bg-gray-900 text-white"
    };

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`${baseStyles} ${providerStyles[provider]}`}
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : children}
        </button>
    );
};