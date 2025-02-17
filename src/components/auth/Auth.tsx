import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Apple, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AuthButton } from './AuthButton';
import { useAuth } from '../../hooks/useAuth';

const features = [
    {
        title: "Local Processing",
        description: "All chat data stays on your device - maximum privacy guaranteed"
    },
    {
        title: "Zero Cost",
        description: "No token limits or usage fees - chat freely without restrictions"
    },
    {
        title: "Unlimited Usage",
        description: "Chat as much as you want, whenever you want"
    },
    {
        title: "Full Control",
        description: "Your data, your rules - complete autonomy over your AI experience"
    }
];

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [, setCurrentFeature] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const { session } = useAuth();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % features.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    // Redirect if already logged in
    if (session) {
        return <Navigate to="/init" replace />;
    }

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/init`
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

    const handleGuestLogin = () => {
        setShowWarning(true);
    };

    const continueAsGuest = () => {
        // 게스트 로그인 처리 로직
        window.location.href = '/init';
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
            <div className="w-full max-w-md space-y-8 p-8">
                {/* Auth Card */}
                <div className="bg-gray-800 rounded-xl shadow-2xl p-8">
                    {/* Logo and Title */}
                    <div className="text-center space-y-6">
                        <div className="flex items-center justify-center w-20 h-20 mx-auto bg-blue-500 rounded-2xl">
                            <LogIn className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white">Welcome to DeepMynd</h2>
                        {/* Rotating Feature Cards */}
                        {/* <div className="mb-12 relative h-24">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className={`absolute top-0 left-0 w-full transform transition-all duration-500 ${index === currentFeature
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-8'
                                        }`}
                                >
                                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                                        <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                                        <p className="text-gray-300">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div> */}

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

                        <AuthButton
                            provider="guest"
                            onClick={handleGuestLogin}
                            loading={loading}
                        >
                            <>
                                <span>Continue without login</span>
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

            {/* Warning Modal */}
            {showWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowWarning(false)}
                    />
                    <div className="relative bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="text-center">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 mb-4">
                                ⚠️
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">Guest Session Notice</h3>
                            <p className="text-gray-400 mb-6">
                                Chat history will not be saved or synced when using DeepMynd without an account. Your data will be lost when you close the browser.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowWarning(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={continueAsGuest}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                                >
                                    Continue as Guest
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}