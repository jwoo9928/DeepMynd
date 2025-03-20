import { ChevronUp, ChevronDown, Bot, Loader2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import LoadingDots from "./LoadingDots";
import ReactMarkdown from "react-markdown";
import { Message, Persona } from "../../../controllers/types";
import RenderContent from "./RenderContent";

interface MessageBubbleProps {
    message: Message;
    isLast: boolean;
    isGenerating: boolean;
    persona: Persona | null
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLast, isGenerating, persona }) => {
    const [isThinkExpanded, setIsThinkExpanded] = useState(true);
    const [isImageLoading, setIsImageLoading] = useState(true);
    const isImage = message.content.startsWith('/image:');

    if (message.role === 'system') {
        return;
    }

    const renderImageOrMarkdown = () => {
        const imageData = message.content.replace('/image:', '');
        return (
            <div className="relative">
                {isImageLoading && (
                    <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                )}
                <img
                    src={imageData}
                    alt="Generated content"
                    className={`max-w-full rounded-lg transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setIsImageLoading(false)}
                />
            </div>
        );
    };

    return (
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role !== 'user' && (
                <div className="mr-2 flex-shrink-0">
                    {persona ? (
                        <img
                            src={URL.createObjectURL(persona.avatar)}
                            alt="Assistant avatar"
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-gray-600" />
                        </div>
                    )}
                    {/* <span className="text-sm text-gray bold mb-1 mb-2 mt-1">
                        {persona?.name ?? 'Assistant'}
                    </span> */}
                </div>
            )}

            <div
                className={`
          max-w-[70%] p-3 rounded-2xl transition-all duration-300 ease-in-out
          ${message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-tl-none'
                    }
          ${isLast && isGenerating ? 'animate-[bubble_0.5s_ease-in-out_infinite]' : ''}
        `}
            >
                {message.role === 'user' ?
                    <ReactMarkdown>
                        {message.content}
                    </ReactMarkdown> : <RenderContent message={message} isGenerating={isGenerating} />}
                {isLast && isGenerating && <LoadingDots />}
            </div>
        </div>
    );
};

export default React.memo(MessageBubble, (prevProps, nextProps) => {
    return prevProps.message.content === nextProps.message.content &&
        prevProps.isLast === nextProps.isLast &&
        prevProps.persona === nextProps.persona &&
        prevProps.isGenerating === nextProps.isGenerating;
});