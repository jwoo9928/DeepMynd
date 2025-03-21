import React, { useState, useMemo } from "react";
import { Bot, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ThinkingContentProps {
    content: string;
    isGenerating: boolean;
}

const ThinkingContent: React.FC<ThinkingContentProps> = ({ content, isGenerating }) => {
    const [isThinkExpanded, setIsThinkExpanded] = useState(false);

    // Parse thinking and normal content
    const { thinkContent, normalContent, isThinking } = useMemo(() => {
        const hasThinkTag = content.includes('<think>');
        const parts = content.split('</think>');

        const isActiveThinking = hasThinkTag && !content.includes('</think>');
        const thinkPart = hasThinkTag ? parts[0].replace('<think>', '') : null;
        const normalPart = parts.length > 1 ? parts[1] : (hasThinkTag ? '' : content);

        return {
            thinkContent: thinkPart,
            normalContent: normalPart,
            isThinking: isActiveThinking
        };
    }, [content]);

    return (
        <div className="space-y-2">
            {thinkContent && (
                <div className="relative">
                    <button
                        onClick={() => setIsThinkExpanded(!isThinkExpanded)}
                        className={`flex items-center gap-2 p-2 ${isGenerating && isThinking ? 'bg-gray-700' : 'bg-gray-500/50'
                            } rounded-lg text-sm`}
                        aria-expanded={isThinkExpanded}
                    >
                        <div className="flex items-center gap-2 text-gray-300">
                            <Bot className="w-5 h-5 text-gray-500" />
                            {isThinking ? 'Thinking...' : 'Done!'}
                            <div className="w-4 h-4">
                                {isThinkExpanded ? (
                                    <ChevronUp size={16} />
                                ) : (
                                    <ChevronDown size={16} />
                                )}
                            </div>
                        </div>
                    </button>

                    {isThinkExpanded && (
                        <div className="mt-2 text-gray-500 italic text-sm">
                            <ReactMarkdown>{thinkContent}</ReactMarkdown>
                        </div>
                    )}
                </div>
            )}

            {normalContent && <ReactMarkdown>{normalContent}</ReactMarkdown>}
        </div>
    );
};

export default React.memo(ThinkingContent);