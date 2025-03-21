import { useMemo, useState } from "react";
import { Message } from "../../../controllers/types";
import { Bot, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface RenderContentProps {
    message: Message;
    isGenerating: boolean;
    // isImage: boolean;
}

const RenderContent = ({
    message,
    isGenerating,
    // isImage,
}: RenderContentProps) => {
    const content = message.content;
    const [isThinkExpanded, setIsThinkExpanded] = useState(false);
    const isThinking = useMemo(() => {
        return content.length > 0 && content.startsWith('<') && !content.includes('</think>');
    }, [content]);

    // if (isImage === true) {
    //     return renderImageOrMarkdown();
    // }

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

                {/* {isThinkExpanded && (
                    <div className="mt-2 text-gray-500 italic text-sm">
                        <ReactMarkdown>{thinkContent.replace('<think>', '')}</ReactMarkdown>
                    </div>
                )} */}
            </div>}

            <ReactMarkdown>{normalContent}</ReactMarkdown>
        </div>
    );
};

export default RenderContent