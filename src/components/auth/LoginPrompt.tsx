import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface LoginPromptProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ isOpen, onClose, message }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl transform transition-all">
                <div className="relative p-6">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h3>
                        <p className="text-gray-600">{message}</p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/auth')}
                            className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
                        >
                            Continue with Email
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPrompt; 