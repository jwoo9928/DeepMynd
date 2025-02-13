// src/pages/Auth.tsx
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Apple, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AuthButton } from './AuthButton';
import { useAuth } from '../../hooks/useAuth';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const { session } = useAuth();

    // Redirect if already logged in
    if (session) {
        return <Navigate to="/chat" replace />;
    }

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/chat`
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error:', error);
            alert('Error signing in. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
            <div className="w-full max-w-md space-y-8 p-8 bg-gray-800 rounded-xl shadow-2xl">
                {/* Logo and Title */}
                <div className="text-center space-y-6">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto bg-blue-500 rounded-2xl">
                        <LogIn className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Welcome to DeepMynd</h2>
                    <p className="text-gray-400">Sign in to start your conversation</p>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-4 mt-8">
                    <AuthButton
                        provider="google"
                        onClick={() => handleSocialLogin('google')}
                        loading={loading}
                    >
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span>Continue with Google</span>
                        </>
                    </AuthButton>

                    <AuthButton
                        provider="apple"
                        onClick={() => handleSocialLogin('apple')}
                        loading={loading}
                    >
                        <>
                            <Apple className="w-5 h-5" />
                            <span>Continue with Apple</span>
                        </>
                    </AuthButton>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-400">
                        By continuing, you agree to DeepMynd's{' '}
                        <a href="/terms" className="text-blue-400 hover:text-blue-300">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-blue-400 hover:text-blue-300">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}