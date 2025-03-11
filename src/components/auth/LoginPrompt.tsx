import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Save, Users, History } from 'lucide-react';

interface LoginPromptProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ isOpen, onClose, message = "Login to unlock all features" }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-lg">
                {/* Header */}
                <div className="p-6 relative bg-blue-50">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 shadow-md"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <img
                                src="/assets/deepmynd-logo.png"
                                alt="DeepMynd Logo"
                                className="w-12 h-12"
                                onError={(e) => {
                                    e.currentTarget.src = "https://via.placeholder.com/48";
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
                        onClick={() => navigate('/auth')}
                        className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                        Continue with Email
                    </button>

                    <button
                        onClick={onClose}
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