import React, { useEffect, useState } from "react";
import { Heart, X, Cpu, Zap, ChevronDown, Settings } from "lucide-react";
import { Persona } from "../../controllers/types";
import { LLMController } from "../../controllers/LLMController";
import ModelSelectionModal from "../models/ModelSelectionModal";
import { DeviceType, Model } from "../models/types";
import { useSetAtom } from "jotai";
import { personaForUpdateAtom } from "../../stores/data.store";
import { uiModeAtom } from "../../stores/ui.store";
import { ModeValues } from "../types";

interface PersonaModalProps {
    selectedPersona: Persona | null;
    showPersonaModal: boolean;
    setShowPersonaModal: React.Dispatch<React.SetStateAction<boolean>>;
    startChat: (model_id?: string, qType?: string) => void;
}

const PersonaModal = ({
    selectedPersona,
    showPersonaModal,
    setShowPersonaModal,
    startChat,
}: PersonaModalProps) => {
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);
    const [qType, setQType] = useState<string>();

    const setTargetPersona = useSetAtom(personaForUpdateAtom)
    const setMode = useSetAtom(uiModeAtom)

    useEffect(() => {
        if (selectedPersona) {
            const model = LLMController.getInstance().getModelInfo(selectedPersona?.model_id || "");
            model && setSelectedModel(model);
            setQType(model?.option?.quantization_types[0]);
        }
    }, [selectedPersona])

    useEffect(() => {
        console.log("selectedModel", selectedModel)
    }, [selectedModel])

    if (!selectedPersona || !showPersonaModal) return null;

    const handleSetModel = (model: Model, qType?: string) => {
        setSelectedModel(model);
        setQType(qType);
    };

    const handleStartChat = () => {
        // Implement model change logic
        startChat(selectedModel?.id, qType);
    };

    const handleEditPersona = () => {
        setTargetPersona(selectedPersona)
        setMode(ModeValues.Edit)
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-6">
            <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-lg">
                {/* Header with gradient background */}
                <div
                    className="p-6 flex flex-col items-center relative"
                    style={{ backgroundColor: `${selectedPersona?.color || "#7FAEFF"}33` }}
                >
                    {/* 편집 버튼 추가 - 왼쪽 상단에 배치 */}
                    <button
                        onClick={handleEditPersona}
                        className="absolute left-4 top-4 text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 shadow-md transition-all duration-200 hover:shadow-lg"
                        title="Edit Persona"
                    >
                        <Settings className="h-5 w-5" />
                    </button>

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
                            {selectedModel?.name || "Select Model"}
                            <ChevronDown className="h-3 w-3" />
                        </button>
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
                            {selectedPersona.tags && selectedPersona.tags.map((feature, index) => (
                                <span
                                    key={index}
                                    className="text-xs rounded-full px-3 py-1"
                                    style={{ backgroundColor: `${selectedPersona.color}33` }}
                                >
                                    {feature}
                                </span>
                            ))}
                            {(!selectedPersona.tags || selectedPersona.tags.length === 0) && (
                                <span className="text-xs text-gray-500">No special abilities specified</span>
                            )}
                        </div>
                    </div>

                    {/* Processing Type */}
                    <div className="flex items-center justify-center bg-gray-50 py-2 px-4 rounded-lg">
                        <div className="flex items-center space-x-4 mt-2">
                            {/* <span className="text-xs text-gray-400">VRAM: {model.limit}GB</span> */}
                            {selectedModel?.available == DeviceType.CPU && (
                                <div className="flex items-center text-sm border rounded-full px-2 py-1 bg-blue-50">
                                    <Cpu className="h-4 w-4 mr-2 text-blue-500" />
                                    <span className="text-xs">CPU Powered</span>
                                </div>
                            )}
                            <div className="flex items-center text-sm border rounded-full px-2 py-1 bg-yellow-50">
                                <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                                <span className="text-xs">GPU Accelerated</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 flex justify-center border-t">
                    <button
                        onClick={handleStartChat}
                        className="px-6 py-2 text-white rounded-full shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105"
                        style={{ backgroundColor: selectedPersona?.color || "#7FAEFF" }}
                    >
                        Start Conversation!
                    </button>
                </div>
            </div>
            <ModelSelectionModal
                isOpen={showModelSelector}
                onClose={() => setShowModelSelector(false)}
                onConfirm={handleSetModel}
            />
        </div>
    );
};

export default React.memo(PersonaModal);