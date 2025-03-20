import React, { useState } from 'react';
import { Apple, X } from 'lucide-react';
import { AuthController } from '../../controllers/AuthController';
import { AuthButton } from './AuthButton';
import { useAtom } from 'jotai';
import { authModalOpen } from '../../stores/ui.store';

interface LoginModalProps {
    // isOpen: boolean;
    // onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = () => {
    const [isOpen, setIsOpen] = useAtom(authModalOpen);
    const [loading, setLoading] = useState(false);
    const [loadingProgress] = useState(0);
    const authController = AuthController.getInstance();

    // useEffect(() => {
    //     if (isOpen) {
    //         // Simulate loading progress for visual feedback
    //         const interval = setInterval(() => {
    //             setLoadingProgress((prev) => {
    //                 const newProgress = prev + Math.random() * 10;
    //                 return newProgress >= 100 ? 100 : newProgress;
    //             });
    //         }, 300);

    //         return () => clearInterval(interval);
    //     } else {
    //         setLoadingProgress(0);
    //     }
    // }, [isOpen]);


    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        setLoading(true);
        try {
            await authController.handleSocialLogin(provider);
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-2">
                    <div className="w-8"></div> {/* Spacer for centering */}
                    <div className="flex-1 text-center">
                        <div className="mx-auto bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">UniMynd</h2>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-6">
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-medium mb-4">Sign in to continue</h3>
                        {loading && (
                            <div className="w-full mb-4">
                                <div className="text-gray-500 mb-2">Loading your AI assistant...</div>
                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${loadingProgress}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-end mt-1">
                                    <span className="text-blue-500 text-sm">{Math.floor(loadingProgress)}%</span>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg mt-4 text-blue-600">
                                    We'll be your special AI friend! 👋
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
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
                            onClick={() => { }}
                            loading={loading}
                        >
                            <>
                                <span>Continue without login</span>
                            </>
                        </AuthButton>
                    </div>
                </div>

                <div className="text-center text-sm text-gray-500">
                    <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;