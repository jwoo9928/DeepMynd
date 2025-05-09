import React, { useRef } from 'react';
import { X, Save, Users, History } from 'lucide-react';
import { useAtom } from 'jotai';
import { authModalOpen } from '../../stores/ui.store';
import { AuthController } from '../../controllers/AuthController';

interface LoginPromptProps {
    message?: string;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ message = "Login to unlock all features" }) => {
    const [isOpen, setIsOpen] = useAtom(authModalOpen)
    const authController = useRef<AuthController>(AuthController.getInstance());

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-lg">
                {/* Header */}
                <div className="p-6 relative bg-blue-50">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 shadow-md"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <img
                                src="public/assets/deepmynd.jpg"
                                alt="DeepMynd Logo"
                                className="w-16 h-16 border-2 border-blue-500 rounded-full"
                                onError={(e) => {
                                    e.currentTarget.src = "./public/assets/deepmynd-logo.png";
                                }}
                            />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Login to UniMynd</h3>
                        <p className="text-sm text-center text-gray-600">{message}</p>
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="px-6 py-4">
                    <h4 className="font-medium mb-3">Unlock these features:</h4>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h5 className="font-medium">Create Personal AI Friends</h5>
                                <p className="text-sm text-gray-600">Design custom personas with unique personalities</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <Save className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h5 className="font-medium">Google Drive Backup</h5>
                                <p className="text-sm text-gray-600">Save your chat history securely to your Drive</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <History className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h5 className="font-medium">Community Personas</h5>
                                <p className="text-sm text-gray-600">Access shared personas from other users</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 bg-gray-50 flex flex-col gap-3">
                    <button
                        onClick={() => authController.current.socialLogin("google")}
                        className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                        Continue with Google
                    </button>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPrompt;