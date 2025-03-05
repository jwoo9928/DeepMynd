import { Paperclip, Pause, Send, X } from "lucide-react";
import { Message, Persona } from "../../controllers/types";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import PersonaSelection from "../persona/PersonaSelection";
import PersonaModal from "../persona/PersonaModal";
import { EVENT_TYPES, eventEmitter } from "../../controllers/events";
import { ChatController } from "../../controllers/ChatController";

interface ChatProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const Chat = ({
    isSidebarOpen,
    setIsSidebarOpen,
}: ChatProps) => {
    const [showPersonaSelection, setShowPersonaSelection] = useState(true);
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
    const [showPersonaModal, setShowPersonaModal] = useState(false);

    const [messages, setMessages] = useState<Message[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const chatController = useRef(ChatController.getInstance());

    const messagesEndRef = useRef<HTMLDivElement>(null);
    // const [boost, setBoost] = useState<boolean>(false);

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            // 메시지 컨테이너의 아래쪽 위치가 화면 하단에 있는지 확인
            const isScrolledToBottom = messagesEndRef.current.getBoundingClientRect().bottom <= window.innerHeight;

            // 사용자가 이미 화면 하단에 있을 경우에만 스크롤을 맨 아래로 내림
            if (isScrolledToBottom) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, []);


    const handleSendMessage = useCallback(() => {
        if (!inputValue.trim()) return;
        chatController.current.sendMessage(inputValue.trim());
        setInputValue('');
    }, [inputValue]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    useEffect(() => {
        const handleMessageReceived = (updatedMessages: Message[]) => {
            setMessages([...updatedMessages]);
            scrollToBottom();
        };

        const handleGenerationStart = () => {
            setIsGenerating(true);
        };

        const handleGenerationComplete = () => {
            setIsGenerating(false);
        };//hikr215
        eventEmitter.on(EVENT_TYPES.MESSAGE_UPDATE, handleMessageReceived);
        eventEmitter.on(EVENT_TYPES.GENERATION_STARTING, handleGenerationStart);
        eventEmitter.on(EVENT_TYPES.GENERATION_COMPLETE, handleGenerationComplete);
        return () => {
            eventEmitter.off(EVENT_TYPES.MESSAGE_UPDATE, handleMessageReceived);
            eventEmitter.off(EVENT_TYPES.GENERATION_STARTING, handleGenerationStart);
            eventEmitter.off(EVENT_TYPES.GENERATION_COMPLETE, handleGenerationComplete);
        }
    }, []);

    const handlePersonaSelection = (persona: Persona) => {
        setSelectedPersona(persona);
        setShowPersonaModal(true);
    };

    // Start chat with selected persona
    const startChat = async () => {
        if (selectedPersona) {
            chatController.current.createChatRoom(selectedPersona);
            eventEmitter.emit(EVENT_TYPES.MODEL_INITIALIZING, selectedPersona.model_id)
            setShowPersonaSelection(false);
            setShowPersonaModal(false);
        }
    };

    // messages가 변경될 때만 새 배열을 생성하고, 그렇지 않으면 캐싱된 결과를 사용
    const renderedMessages = useMemo(() => {
        return messages.map((msg, index) => (
            <MessageBubble
                key={index}
                message={msg}
                isLast={index === messages.length - 1}
                isGenerating={isGenerating}
            />
        ));
    }, [messages, isGenerating]);


    return (
        <div className="flex-1 flex flex-col h-full">
            <ChatHeader toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className="flex-1 overflow-y-auto bg-gray-50">
                {showPersonaSelection ?
                    <PersonaSelection
                        handlePersonaSelection={handlePersonaSelection}
                    /> : (
                        <div className="p-4 space-y-4">
                            {renderedMessages}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
            </div>

            <div className="bg-white border-t border-gray-200 p-4 space-y-2">
                {/* 입력창과 버튼들 */}
                <div className="flex items-center space-x-2">
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none"
                        disabled={showPersonaSelection}
                    />

                    <button
                        className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors duration-200"
                        disabled={showPersonaSelection}
                    >
                        <Paperclip className="h-4 w-4" />
                    </button>

                    {isGenerating ? (
                        <button
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                            onClick={() => chatController.current.stopGeneration()}
                        >
                            <Pause className="h-5 w-5" />
                        </button>
                    ) : (
                        <button
                            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || showPersonaSelection}
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Boost Thinking toggle button - only shown when chat is active */}
                {/* {!showPersonaSelection && (
                    <button
                        onClick={() => { }}//setBoost(prev => !prev)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${true //boost
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Boost Thinking
                    </button>
                )} */}
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

export default Chat