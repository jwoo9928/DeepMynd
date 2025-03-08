import { Paperclip, Pause, Send } from "lucide-react";
import { Message, Persona } from "../../controllers/types";
import ChatHeader from "./atoms/ChatHeader";
import MessageBubble from "./atoms/MessageBubble";
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { EVENT_TYPES, eventEmitter } from "../../controllers/events";
import { ChatController } from "../../controllers/ChatController";
import ChatInput from "./atoms/ChatInput";

interface ChatProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const Chat = ({
    isSidebarOpen,
    setIsSidebarOpen,
}: ChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [persona, setPersona] = useState<Persona | null>(null);
    const chatController = useRef(ChatController.getInstance());

    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const handlePersona = useCallback((persona: Persona) => {
        setPersona(persona)
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
            updatedMessages.length > 0 ? setMessages([...updatedMessages]): setMessages([]);
            scrollToBottom();
        };

        const handleGenerationStart = () => {
            setIsGenerating(true);
        };

        const handleGenerationComplete = () => {
            setIsGenerating(false);
        };//hikr215
        eventEmitter.on(EVENT_TYPES.MESSAGE_UPDATE, handleMessageReceived);
        eventEmitter.on(EVENT_TYPES.CHANGE_PERSONA, handlePersona);
        eventEmitter.on(EVENT_TYPES.GENERATION_STARTING, handleGenerationStart);
        eventEmitter.on(EVENT_TYPES.GENERATION_COMPLETE, handleGenerationComplete);
        return () => {
            eventEmitter.off(EVENT_TYPES.MESSAGE_UPDATE, handleMessageReceived);
            eventEmitter.off(EVENT_TYPES.GENERATION_STARTING, handleGenerationStart);
            eventEmitter.off(EVENT_TYPES.GENERATION_COMPLETE, handleGenerationComplete);
        }
    }, []);

    // messages가 변경될 때만 새 배열을 생성하고, 그렇지 않으면 캐싱된 결과를 사용
    const renderedMessages = useMemo(() => {
        return messages.map((msg, index) => (
            <MessageBubble
                key={index}
                persona={persona}
                message={msg}
                isLast={index === messages.length - 1}
                isGenerating={isGenerating}
            />
        ));
    }, [messages, isGenerating, persona]);


    return (
        <div className="flex-1 flex flex-col h-full">
            <ChatHeader toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className="flex-1 overflow-y-auto bg-gray-50">
                <div className="p-4 space-y-4">
                    {renderedMessages}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <ChatInput
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleKeyPress={handleKeyPress}
                handleSendMessage={handleSendMessage}
                isGenerating={isGenerating}
            />
        </div>
    )
}

export default Chat