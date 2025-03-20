import { ChevronUp, ChevronDown, Bot, Loader2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import LoadingDots from "./LoadingDots";
import ReactMarkdown from "react-markdown";
import { Message, Persona } from "../../../controllers/types";

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

    const renderContent = () => {
        const content = message.content;
        const isThinking = useMemo(() => {
            return content.length > 0 && content.startsWith('<') && !content.includes('</think>');
        }, [content]);

        if (isImage === true) {
            return renderImageOrMarkdown();
        }

        const parts = content.split('</think>');
        const [thinkContent, normalContent] = isThinking ? [parts[0], null] : parts.length > 1 ? parts : [null, parts[0]];

        return (
            <div className="space-y-2">
                {thinkContent && <div className="relative">
                    <button
                        onClick={() => setIsThinkExpanded(!isThinkExpanded)}
                        className={`flex items-center gap-2 p-2 bg-gray-700${(isGenerating && isThinking) ? '' : '/50'} rounded-lg text-sm`}
                    >
                        <div className="flex items-center gap-2 text-gray-300">
                            <Bot className="w-5 h-5 text-gray-500" />
                            {isThinking ? 'Thinking...' : 'Done!'}
                            <div className="w-4 h-4">
                                {isThinkExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </div>
                    </button>

                    {isThinkExpanded && (
                        <div className="mt-2 text-gray-500 italic text-sm">
                            <ReactMarkdown>{thinkContent.replace('<think>', '')}</ReactMarkdown>
                        </div>
                    )}
                </div>}

                <ReactMarkdown>{normalContent}</ReactMarkdown>
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
                    </ReactMarkdown> : renderContent()}
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