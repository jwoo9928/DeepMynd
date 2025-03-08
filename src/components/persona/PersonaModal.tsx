import React, { useState } from "react";
import { Heart, X, Cpu, Zap, ChevronDown } from "lucide-react";
import { Persona } from "../../controllers/types";
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
    const [showModelSelector, setShowModelSelector] = useState(false);
    
    if (!selectedPersona || !showPersonaModal) return null;

    const model = LLMController.getInstance().getModelInfo(selectedPersona?.model_id || "");
    const isGPU = true //model?.gpu_enabled || false; // Assuming this property exists in your model info
    
    // Mock available models - replace with your actual model list
    const availableModels = [
        { id: "gpt-4", name: "GPT-4", gpu_enabled: true },
        { id: "claude-3", name: "Claude 3", gpu_enabled: true },
        { id: "llama-3", name: "Llama 3", gpu_enabled: false },
        { id: "mistral", name: "Mistral", gpu_enabled: true },
    ];

    const handleModelChange = (modelId: string) => {
        // Implement model change logic
        console.log("Changed model to:", modelId);
        setShowModelSelector(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-6">
            <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-lg">
                {/* Header with gradient background */}
                <div
                    className="p-6 flex flex-col items-center relative"
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
                        style={{ borderColor: selectedPersona?.color || "#7FAEFF" }}
                    >
                        <img 
                            src={URL.createObjectURL(selectedPersona.avatar)} 
                            alt={selectedPersona.name} 
                            className="w-full h-full object-cover rounded-full" 
                        />
                    </div>

                    <h3 className="font-bold text-xl mb-2">{selectedPersona.name}</h3>
                    
                    {/* Model selector */}
                    <div className="relative">
                        <button 
                            className="text-sm bg-white px-3 py-1 rounded-full shadow-sm flex items-center gap-1 hover:bg-gray-50"
                            onClick={() => setShowModelSelector(!showModelSelector)}
                        >
                            {model?.name || "Select Model"}
                            <ChevronDown className="h-3 w-3" />
                        </button>
                        
                        {showModelSelector && (
                            <div className="absolute top-full mt-1 bg-white rounded-lg shadow-lg py-1 w-48 z-10">
                                {availableModels.map(m => (
                                    <button
                                        key={m.id}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between"
                                        onClick={() => handleModelChange(m.id)}
                                    >
                                        <span>{m.name}</span>
                                        {m.gpu_enabled ? 
                                            <Zap className="h-3 w-3 text-yellow-500" /> : 
                                            <Cpu className="h-3 w-3 text-blue-500" />
                                        }
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    <p className="mb-6 text-gray-700 text-center">{selectedPersona.description}</p>

                    <div className="mb-4">
                        <h5 className="font-semibold mb-3 flex items-center">
                            <Heart className="h-4 w-4 mr-2 text-red-400" />
                            Special Abilities:
                        </h5>
                        <div className="flex flex-wrap gap-2">
                            {/* {selectedPersona.features && selectedPersona.features.map((feature, index) => (
                                <span
                                    key={index}
                                    className="text-xs rounded-full px-3 py-1"
                                    style={{ backgroundColor: `${selectedPersona.color}33` }}
                                >
                                    {feature}
                                </span>
                            ))}
                            {(!selectedPersona.features || selectedPersona.features.length === 0) && (
                                <span className="text-xs text-gray-500">No special abilities specified</span>
                            )} */}
                        </div>
                    </div>
                    
                    {/* Processing Type */}
                    <div className="flex items-center justify-center bg-gray-50 py-2 px-4 rounded-lg">
                        {isGPU ? (
                            <div className="flex items-center text-sm">
                                <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                                <span className="font-medium">GPU Accelerated</span>
                            </div>
                        ) : (
                            <div className="flex items-center text-sm">
                                <Cpu className="h-4 w-4 mr-2 text-blue-500" />
                                <span className="font-medium">CPU Powered</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 flex justify-center border-t">
                    <button
                        onClick={startChat}
                        className="px-6 py-2 text-white rounded-full shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105"
                        style={{ backgroundColor: selectedPersona?.color || "#7FAEFF" }}
                    >
                        Start Conversation!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(PersonaModal);