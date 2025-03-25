import React, { useEffect, useMemo, useState } from "react";
import { DBController, Language } from "../../../controllers/DBController";
import { useAtom } from "jotai";
import { activateTranslateLanguageAtom } from "../../../stores/data.store";
import { X, Search, ChevronRight } from "lucide-react";

interface LanguagesProps {
    isLanguageModalOpen: boolean;
    setIsLanguageModalOpen: (isOpen: boolean) => void;
}

const Languages = ({
    isLanguageModalOpen,
    setIsLanguageModalOpen,
}: LanguagesProps) => {
    const [activatedLanguage, setActivatedLanguage] = useAtom<Language | null>(activateTranslateLanguageAtom);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        DBController.getDatabase().getLanguages().then(setLanguages);
    }, []);

    useEffect(() => {
        if (activatedLanguage) {
            setSelectedLanguage(activatedLanguage);
        }
    }, [activatedLanguage]);

    const filteredLanguages = useMemo(() => {
        if (!searchTerm.trim()) return languages;

        const lowerSearchTerms = searchTerm.trim().toLowerCase().split(/\s+/);
        return languages.filter(language => {
            const lowerName = language.language.toLowerCase();
            return lowerSearchTerms.every(term => lowerName.includes(term));
        });
    }, [languages, searchTerm]);

    const handleLanguageSelect = (language: Language) => {
        setSelectedLanguage(language);
    };

    const confirmLanguageSelection = () => {
        if (selectedLanguage) {
            setActivatedLanguage(selectedLanguage);
            setIsLanguageModalOpen(false);
        }
    };

    if (!isLanguageModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md mx-4">
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Select Translation Language</h2>
                        <button onClick={() => setIsLanguageModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search languages..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </div>

                    {/* Scrollable Language List */}
                    <div className="h-80 overflow-y-auto pr-2 space-y-2">
                        {filteredLanguages.length > 0 ? (
                            filteredLanguages.map((language) => (
                                <div
                                    key={language.id}
                                    onClick={() => handleLanguageSelect(language)}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedLanguage?.id === language.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{language.language}</h3>
                                        </div>
                                        {selectedLanguage?.id === language.id && (
                                            <div className="text-blue-500">
                                                <ChevronRight className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                No languages match your search criteria
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setIsLanguageModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmLanguageSelection}
                            disabled={!selectedLanguage}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm Selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Languages);