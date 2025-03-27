import React, { useState, ReactNode } from 'react';
import { Camera, Edit, Trash2, X, DownloadCloud, Globe, Unlink, Link, Grid3x3, Share2 } from 'lucide-react';

// Custom Dialog Component
interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto relative">
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                >
                    <X size={24} />
                </button>
                {children}
            </div>
        </div>
    );
};

// Custom Drawer Component
interface DrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
}

const Drawer: React.FC<DrawerProps> = ({ open, onOpenChange, children }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            <div
                className="fixed inset-0 bg-black/50"
                onClick={() => onOpenChange(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[90vh] overflow-y-auto">
                {children}
            </div>
        </div>
    );
};

// Custom Avatar Component
interface AvatarProps {
    src: string;
    alt: string;
    fallback?: string;
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, className = '' }) => {
    const [imageError, setImageError] = useState(!src);

    return (
        <div className={`relative inline-flex items-center justify-center overflow-hidden bg-gray-100 rounded-full ${className}`}>
            {(imageError || !src) ? (
                <span className="text-gray-600 font-medium">
                    {fallback || alt[0].toUpperCase()}
                </span>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            )}
        </div>
    );
};

// Settings Page Component
const SettingsPage: React.FC = () => {
    const [profileImage, setProfileImage] = useState<string>('');
    const [nickname, setNickname] = useState<string>('User');
    const [isNicknameEditing, setIsNicknameEditing] = useState(false);
    const [isAlbumOpen, setIsAlbumOpen] = useState(false);
    const [isDesktopAlbumOpen, setIsDesktopAlbumOpen] = useState(false);
    const [isModelManageOpen, setIsModelManageOpen] = useState(false);
    const [isPersonaManageOpen, setIsPersonaManageOpen] = useState(false);
    const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
    const [language, setLanguage] = useState<string>('English');
    const [cachedModels, setCachedModels] = useState([
        { id: 1, name: 'Qwen2.5-0.5B-Instruct-ONNX', size: '500MB' },
        { id: 2, name: 'DeepMynd Image', size: '1.2GB' },
    ]);
    const [sharedPersonas, setSharedPersonas] = useState([
        { id: 1, name: 'Anime Schoolgirl', model: 'UniMynd' },
        { id: 2, name: 'SocRates', model: 'UniMynd' },
    ]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteModel = (id: number) => {
        setCachedModels(cachedModels.filter(model => model.id !== id));
    };

    const handleDeletePersona = (id: number) => {
        setSharedPersonas(sharedPersonas.filter(persona => persona.id !== id));
    };

    const languageOptions = ['English', '한국어', '日本語', '中文'];

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            {/* Profile Section */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Avatar
                            src={profileImage}
                            alt="Profile"
                            className="w-24 h-24"
                            fallback={nickname[0]}
                        />
                        <label
                            htmlFor="image-upload"
                            className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 cursor-pointer"
                        >
                            <Camera size={16} />
                            <input
                                type="file"
                                id="image-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </label>
                    </div>
                    <div className="flex-1 space-y-2">
                        {!isNicknameEditing ? (
                            <div className="flex items-center space-x-2">
                                <h2 className="text-xl font-semibold">{nickname}</h2>
                                <button
                                    onClick={() => setIsNicknameEditing(true)}
                                    className="text-gray-500 hover:text-gray-800"
                                >
                                    <Edit size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="border rounded px-2 py-1 flex-1"
                                />
                                <button
                                    onClick={() => setIsNicknameEditing(false)}
                                    className="bg-blue-500 text-white rounded px-2 py-1"
                                >
                                    Save
                                </button>
                            </div>
                        )}

                        {/* Language Selector */}
                        <div className="flex items-center space-x-2">
                            <Globe size={16} className="text-gray-500" />
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="border rounded px-2 py-1"
                            >
                                {languageOptions.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Google Drive Connection */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <span className="font-medium">Google Drive</span>
                        {isGoogleDriveConnected ? (
                            <span className="text-green-500">Connected</span>
                        ) : (
                            <span className="text-gray-500">Not Connected</span>
                        )}
                    </div>
                    {isGoogleDriveConnected ? (
                        <button
                            onClick={() => setIsGoogleDriveConnected(false)}
                            className="text-red-500 flex items-center space-x-1"
                        >
                            <Unlink size={16} />
                            <span>Disconnect</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsGoogleDriveConnected(true)}
                            className="text-blue-500 flex items-center space-x-1"
                        >
                            <Link size={16} />
                            <span>Connect</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Album Section */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Image Album</h2>
                    <div className="space-x-2">
                        <button
                            onClick={() => setIsAlbumOpen(true)}
                            className="text-blue-500 hover:text-blue-700 lg:hidden"
                        >
                            View All (Mobile)
                        </button>
                        <button
                            onClick={() => setIsDesktopAlbumOpen(true)}
                            className="text-blue-500 hover:text-blue-700 hidden lg:block"
                        >
                            View All (Desktop)
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((_, index) => (
                        <div
                            key={index}
                            className="bg-gray-200 aspect-square rounded"
                        />
                    ))}
                </div>
            </div>

            {/* Shared Personas Section */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Shared Personas</h2>
                    <button
                        onClick={() => setIsPersonaManageOpen(true)}
                        className="text-blue-500 hover:text-blue-700"
                    >
                        Manage
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {sharedPersonas.map(persona => (
                        <div
                            key={persona.id}
                            className="bg-gray-100 p-2 rounded flex flex-col items-center"
                        >
                            <Grid3x3 size={24} className="text-gray-500 mb-2" />
                            <p className="text-sm font-medium">{persona.name}</p>
                            <p className="text-xs text-gray-500">{persona.model}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* [Rest of the existing sections remain the same] */}

            {/* Desktop Album Modal */}
            <Dialog open={isDesktopAlbumOpen} onOpenChange={setIsDesktopAlbumOpen}>
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Image Album</h2>
                    <div className="grid grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((_, index) => (
                            <div
                                key={index}
                                className="bg-gray-200 aspect-square rounded"
                            />
                        ))}
                    </div>
                </div>
            </Dialog>

            {/* Persona Management Modal */}
            <Dialog open={isPersonaManageOpen} onOpenChange={setIsPersonaManageOpen}>
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Manage Shared Personas</h2>
                    <div className="space-y-2">
                        {sharedPersonas.map(persona => (
                            <div
                                key={persona.id}
                                className="flex justify-between items-center p-2 border rounded"
                            >
                                <div>
                                    <p className="font-medium">{persona.name}</p>
                                    <p className="text-sm text-gray-500">{persona.model}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        className="text-blue-500 hover:text-blue-700"
                                    >
                                        <Share2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePersona(persona.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Dialog>

            {/* Mobile Album Modal */}
            <Drawer open={isAlbumOpen} onOpenChange={setIsAlbumOpen}>
                <div>
                    <h2 className="text-xl font-semibold mb-4">Image Album</h2>
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, index) => (
                            <div
                                key={index}
                                className="bg-gray-200 aspect-square rounded"
                            />
                        ))}
                    </div>
                </div>
            </Drawer>
        </div>
    );
};

export default SettingsPage;