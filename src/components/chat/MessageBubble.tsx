import React from "react";
import { Message } from "../../controllers/types";
import LoadingDots from "./LoadingDots";

const MessageBubble = ({ message, isLast, isGenerating }: {
    message: Message;
    isLast: boolean;
    isGenerating: boolean;
}) => (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div
            className={`
        max-w-[70%] p-3 rounded-2xl transition-all duration-300 ease-in-out
        ${message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }
        ${isLast && isGenerating ? 'animate-[bubble_0.5s_ease-in-out_infinite]' : ''}
      `}
        >
            <p>{message.content}{isLast && isGenerating && <LoadingDots />}</p>
        </div>
    </div>
);

export default MessageBubble