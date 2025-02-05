
import { Send } from "lucide-react";
import { Message } from "../../controllers/types";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import React, { useEffect } from "react";

interface ChatProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    messages: Message[];
    isGenerating: boolean;
    inputValue: string;
    setInputValue: (value: string) => void;
    handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleSendMessage: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

const Chat = ({
    isSidebarOpen,
    setIsSidebarOpen,
    messages,
    isGenerating,
    inputValue,
    setInputValue,
    handleKeyPress,
    handleSendMessage,
    messagesEndRef
}: ChatProps) => {
    useEffect(()=>{
        console.log(messages)
    },[messages])
    return (
        <div className="flex-1 flex flex-col h-full">
            <ChatHeader toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <MessageBubble
                        key={index}
                        message={msg}
                        isLast={index === messages.length - 1}
                        isGenerating={isGenerating}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none"
                    />
                    <button
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSendMessage}
                        disabled={isGenerating || !inputValue.trim()}
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>

    )
}

export default Chat