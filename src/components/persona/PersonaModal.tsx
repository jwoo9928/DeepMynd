import { Heart, X } from "lucide-react";
import { Persona } from "../../controllers/types";
import React, { useCallback } from "react";
import { LLMController } from "../../controllers/LLMController";

interface PersonaModalProps {
    selectedPersona: Persona | null;
    showPersonaModal: boolean;
    setShowPersonaModal: React.Dispatch<React.SetStateAction<boolean>>;
    startChat: () => void;
}

// const personas: Persona[] = [
//     {
//         id: "p1",
//         name: "Assistant",
//         avatar: "/assets/assistant-avatar.png",
//         description: "General purpose AI assistant that can help with various tasks",
//         model: "GPT-4",
//         features: ["General knowledge", "Creative writing", "Coding assistance", "Learning support"],
//         color: "#FF9F7F" // Soft coral
//     },
//     {
//         id: "p2",
//         name: "Code Expert",
//         avatar: "/assets/coder-avatar.png",
//         description: "Specialized in helping with programming and development tasks",
//         model: "Claude-3",
//         features: ["Code completion", "Debugging", "Code review", "Technical explanations"],
//         color: "#7FAEFF" // Soft blue
//     },
//     {
//         id: "p3",
//         name: "Academic",
//         avatar: "/assets/academic-avatar.png",
//         description: "Perfect for students and researchers seeking help with academic content",
//         model: "GPT-4 Turbo",
//         features: ["Research assistance", "Paper writing", "Citation help", "Summarization"],
//         color: "#9F7FFF" // Soft purple
//     },
//     {
//         id: "p4",
//         name: "Creative Partner",
//         avatar: "/assets/creative-avatar.png",
//         description: "Helps with creative projects and artistic endeavors",
//         model: "Claude-3 Opus",
//         features: ["Storytelling", "Poetry", "Idea generation", "Content creation"],
//         color: "#FF7FD5" // Soft pink
//     },
//     {
//         id: "p5",
//         name: "Business Advisor",
//         avatar: "/assets/business-avatar.png",
//         description: "Assists with business strategy, marketing, and professional communications",
//         model: "GPT-4o",
//         features: ["Business planning", "Marketing strategy", "Professional writing", "Data analysis"],
//         color: "#7FD5FF" // Soft sky blue
//     },
//     {
//         id: "p6",
//         name: "Language Tutor",
//         avatar: "/assets/language-avatar.png",
//         description: "Helps learn new languages and improve language skills",
//         model: "Gemini Pro",
//         features: ["Language learning", "Grammar correction", "Vocabulary building", "Conversation practice"],
//         color: "#7FFFB0" // Soft mint
//     }
// ];


const PersonaModal = ({
    selectedPersona,
    showPersonaModal,
    setShowPersonaModal,
    startChat,
}: PersonaModalProps) => {
    if (!selectedPersona || !showPersonaModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
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
                        <img src={selectedPersona.avatar} alt={selectedPersona.name} className="w-full h-full object-cover rounded-full" />
                    </div>

                    <h3 className="font-bold text-xl mb-1">{selectedPersona.name}</h3>
                    <span className="text-sm bg-white px-3 py-1 rounded-full shadow-sm">
                        {selectedPersona.model_id}
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