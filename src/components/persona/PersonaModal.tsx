import { Heart, X } from "lucide-react";
import { Persona } from "../../controllers/types";
import React from "react";
import { LLMController } from "../../controllers/LLMController";

interface PersonaModalProps {
    selectedPersona: Persona | null;
    showPersonaModal: boolean;
    setShowPersonaModal: React.Dispatch<React.SetStateAction<boolean>>;
    startChat: () => void;
}


const PersonaModal = ({
    selectedPersona,
    showPersonaModal,
    setShowPersonaModal,
    startChat,
}: PersonaModalProps) => {
    if (!selectedPersona || !showPersonaModal) return null;

    const model = LLMController.getInstance().getModelInfo(selectedPersona?.model_id || "");

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
                {/* Header with gradient background */}
                <div
                    className="p-6 flex flex-col items-center relative"
                    //@ts-ignore
                    style={{ backgroundColor: `${selectedPersona?.color || "#7FAEFF"}33` }}
                >
                    <button
                        onClick={() => setShowPersonaModal(false)}
                        className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 shadow-md"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div
                        className="w-24 h-24 rounded-full bg-white p-1 shadow-lg mb-4 overflow-hidden border-4"
                        //@ts-ignore
                        style={{ borderColor: selectedPersona?.color || "#7FAEFF" }}
                    >
                        <img src={URL.createObjectURL(selectedPersona.avatar)} alt={selectedPersona.name} className="w-full h-full object-cover rounded-full" />
                    </div>

                    <h3 className="font-bold text-xl mb-1">{selectedPersona.name}</h3>
                    <span className="text-sm bg-white px-3 py-1 rounded-full shadow-sm">
                        {model?.name}
                    </span>
                </div>

                <div className="p-6">
                    <p className="mb-6 text-gray-700 text-center">{selectedPersona.description}</p>

                    <div className="mb-6">
                        <h5 className="font-semibold mb-3 flex items-center">
                            <Heart className="h-4 w-4 mr-2 text-red-400" />
                            Special Abilities:
                        </h5>
                        <div className="flex flex-wrap gap-2">
                            {/* {selectedPersona.features.map((feature, index) => (
                                <span
                                    key={index}
                                    className="text-xs rounded-full px-3 py-1"
                                    style={{ backgroundColor: `${selectedPersona.color}33` }}
                                >
                                    {feature}
                                </span>
                            ))} */}
                        </div>
                    </div>
                </div>

                <div className="p-4 flex justify-center border-t">
                    <button
                        onClick={startChat}
                        className="px-6 py-2 text-white rounded-full shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105"
                        //@ts-ignore
                        style={{ backgroundColor: selectedPersona?.color || "#7FAEFF" }}
                    >
                        Start Chatting!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(PersonaModal)