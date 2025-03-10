import { Persona } from "../../controllers/types";
import React, { useState, useRef } from "react";
import PersonaSelection from "./PersonaSelection";
import PersonaModal from "./PersonaModal";
import { EVENT_TYPES, eventEmitter } from "../../controllers/events";
import { ChatController } from "../../controllers/ChatController";


const PersonaLayout = () => {
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
    const [showPersonaModal, setShowPersonaModal] = useState(false);

    const chatController = useRef(ChatController.getInstance());

    const handlePersonaSelection = (persona: Persona) => {
        setSelectedPersona(persona);
        setShowPersonaModal(true);
    };

    // Start chat with selected persona
    const startChat = async (model_id?: string) => {
        if (selectedPersona) {
            let persona: Persona = {
                ...selectedPersona,
                model_id: model_id || selectedPersona.model_id
            }
            if (selectedPersona) {
                chatController.current.createChatRoom(persona);
                eventEmitter.emit(EVENT_TYPES.MODEL_INITIALIZING, persona.model_id);
                setShowPersonaModal(false);
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full">

            <div className="flex-1 overflow-y-auto bg-gray-50">
                <PersonaSelection
                    handlePersonaSelection={handlePersonaSelection}
                />
            </div>

            <div className="bg-white border-t border-gray-200 p-4 space-y-2">

            </div>

            <PersonaModal
                setShowPersonaModal={setShowPersonaModal}
                selectedPersona={selectedPersona}
                showPersonaModal={showPersonaModal}
                startChat={startChat}
            />
        </div>
    )
}

export default PersonaLayout