import React from "react";
import { Message } from "../../controllers/types";
import LoadingDots from "./LoadingDots";
import ReactMarkdown from 'react-markdown';

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
            <ReactMarkdown>
                {message.content}
            </ReactMarkdown>
            {isLast && isGenerating && <LoadingDots />}
        </div>
    </div>
);

export default React.memo(MessageBubble, (prevProps, nextProps) => {
    // message의 내용이 바뀌거나 마지막 메시지 여부가 변할 때만 리렌더링
    return prevProps.message.content === nextProps.message.content &&
        prevProps.isLast === nextProps.isLast &&
        prevProps.isGenerating === nextProps.isGenerating;
});