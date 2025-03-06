import { ChevronUp, ChevronDown, Bot, Loader2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import LoadingDots from "./LoadingDots";
import { Message } from "../../controllers/types";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  isGenerating: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLast, isGenerating }) => {
  const [isThinkExpanded, setIsThinkExpanded] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(true);
  // const image = PersonaController.focusing.avartar; //Blob
  const isImage = message.content.startsWith('/image:');
  console.log("message", message);

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
            className={`flex items-center gap-2 p-2 bg-gray-700${isThinking ? '/50' : ''} rounded-lg text-sm`}
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
           <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
        </div>
      )}
      <div className="flex flex-col items-start">
        <text className="text-xs text-gray-500">{message.role === 'user' ? 'You' : 'DeepMynd'}</text>
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
    </div>
  );
};

export default React.memo(MessageBubble, (prevProps, nextProps) => {
  return prevProps.message.content === nextProps.message.content &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.isGenerating === nextProps.isGenerating;
});