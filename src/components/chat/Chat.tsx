import { Message, Persona } from "../../controllers/types";
import MessageBubble from "./atoms/MessageBubble";
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { EVENT_TYPES, eventEmitter } from "../../controllers/events";
import { ChatController } from "../../controllers/ChatController";
import ChatInput from "./atoms/ChatInput";
import { PersonaController } from "../../controllers/PersonaController";

// Helper to group related messages
const processMessagesForGrouping = (messages: Message[]): Message[][] => {
    const groupedMessages: Message[][] = [];
    let currentGroup: Message[] = [];

    messages.forEach((message, index) => {
        // Start a new group if this is a user message
        if (message.role === 'user') {
            if (currentGroup.length > 0) {
                groupedMessages.push([...currentGroup]);
                currentGroup = [];
            }
            currentGroup.push(message);

            // Check if the next message is a translation
            const nextMessage = messages[index + 1];
            if (nextMessage && nextMessage.role === 'ts') {
                currentGroup.push(nextMessage);
            }
        }
        // Start a new group if this is an assistant message
        else if (message.role === 'assistant') {
            if (currentGroup.length > 0 &&
                (currentGroup[0].role === 'user' || currentGroup[0].role === 'ts')) {
                groupedMessages.push([...currentGroup]);
                currentGroup = [];
            }
            currentGroup.push(message);

            // Check if the next message is an original message
            const nextMessage = messages[index + 1];
            if (nextMessage && nextMessage.role === 'origin') {
                currentGroup.push(nextMessage);
            }
        }
        // Skip standalone ts or origin messages as they should be paired
        else if (message.role !== 'ts' && message.role !== 'origin' && message.role !== 'system') {
            if (currentGroup.length > 0) {
                groupedMessages.push([...currentGroup]);
            }
            currentGroup = [message];
        }
    });

    // Add the last group if it exists
    if (currentGroup.length > 0) {
        groupedMessages.push(currentGroup);
    }

    return groupedMessages;
};

const Chat = () => {
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

    const handleMessageReceived = useCallback((messages: Message[]) => {
        if (!isGenerating && chatController.current.isFocusingRoomGenerating()) {
            setIsGenerating(true);
        }
        setMessages([...messages])
        scrollToBottom();
    }, []);

    useEffect(() => {
        const handleGenerationStart = () => {
            chatController.current.isFocusingRoomGenerating() &&
                setIsGenerating(true);
        };

        const handleGenerationComplete = () => {
            setIsGenerating(false);
        };
        setMessages([...chatController.current.getFocusedRoomMessages()]);
        setPersona(PersonaController.getInstance().getFocusedPersona() ?? null)

        eventEmitter.on(EVENT_TYPES.MESSAGE_UPDATE, handleMessageReceived);
        eventEmitter.on(EVENT_TYPES.CHANGE_PERSONA, handlePersona);
        eventEmitter.on(EVENT_TYPES.GENERATION_STARTING, handleGenerationStart);
        eventEmitter.on(EVENT_TYPES.GENERATION_COMPLETE, handleGenerationComplete);
        return () => {
            eventEmitter.off(EVENT_TYPES.MESSAGE_UPDATE, handleMessageReceived);
            eventEmitter.off(EVENT_TYPES.CHANGE_PERSONA, handlePersona);
            eventEmitter.off(EVENT_TYPES.GENERATION_STARTING, handleGenerationStart);
            eventEmitter.off(EVENT_TYPES.GENERATION_COMPLETE, handleGenerationComplete);
        }
    }, []);

    // Process messages into grouped format
    const groupedMessages = useMemo(() => {
        return processMessagesForGrouping(messages);
    }, [messages]);

    // Render messages with proper grouping
    const renderedMessages = useMemo(() => {
        return groupedMessages.map((group, groupIndex) => {
            const isLastGroup = groupIndex === groupedMessages.length - 1;
            const mainMessage = group[0]; // The primary message (user or assistant)
            const secondaryMessage = group.length > 1 ? group[1] : null; // ts or origin message

            return (
                <MessageBubble
                    key={groupIndex}
                    mainMessage={mainMessage}
                    secondaryMessage={secondaryMessage}
                    isLast={isLastGroup && mainMessage.role === 'assistant'}
                    isGenerating={isGenerating}
                    persona={persona}
                />
            );
        });
    }, [groupedMessages, isGenerating, persona]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto bg-gray-50 max-h-[calc(100vh-100px)]">
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
                currentModel={persona?.name || "Assistant"}
            />
        </div>
    )
}

export default Chat;