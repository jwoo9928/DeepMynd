import { ChevronUp, ChevronDown, Bot } from "lucide-react";
import React, { useState } from "react";
import LoadingDots from "./LoadingDots";
import { Message } from "../../controllers/types";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  isGenerating: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLast, isGenerating }) => {
  const [isThinkExpanded, setIsThinkExpanded] = useState(false);

  const renderImageOrMarkdown = (content: string) => {
    if (content.startsWith('/image:')) {
      const imageData = content.replace('/image:', '');
      return (
        <img 
          src={`data:image/jpeg;base64,${imageData}`} 
          alt="Generated content"
          className="max-w-full rounded-lg"
        />
      );
    }
    return <ReactMarkdown>{content}</ReactMarkdown>;
  };

  const renderContent = () => {
    const content = message.content;
    const parts = content.split('</think>');

    // </Think>가 없으면 모든 내용이 Think 영역
    if (parts.length === 1) {
      return (
        <div className="relative">
          <button
            onClick={() => setIsThinkExpanded(!isThinkExpanded)}
            className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg text-sm"
          >
            <div className="flex items-center gap-2 text-gray-300">
              <Bot className="w-5 h-5 text-gray-500" />
              Thinking...
              <div className="w-4 h-4">
                {isThinkExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
          </button>

          {isThinkExpanded && (
            <div className="mt-2 italic text-sm">
              {renderImageOrMarkdown(content.replace('<think>', ''))}
            </div>
          )}
        </div>
      );
    }

    // </Think>가 있으면 Think 영역과 일반 메시지 영역으로 분리
    const [thinkContent, normalContent] = parts;
    
    return (
      <div className="space-y-2">
        <div className="relative">
          <button
            onClick={() => setIsThinkExpanded(!isThinkExpanded)}
            className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg text-sm"
          >
            <div className="flex items-center gap-2 text-gray-300">
              <Bot className="w-5 h-5 text-gray-500" />
              Thinking...
              <div className="w-4 h-4">
                {isThinkExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
          </button>

          {isThinkExpanded && (
            <div className="mt-2 text-gray-500 italic text-sm">
              {renderImageOrMarkdown(thinkContent.replace('<think>', ''))}
            </div>
          )}
        </div>

        {normalContent && (
          renderImageOrMarkdown(normalContent)
        )}
      </div>
    );
  };

  return (
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
        {message.role === 'user' ?
          <ReactMarkdown>{message.content}</ReactMarkdown> 
          : renderContent()
        }
        {isLast && isGenerating && <LoadingDots />}
      </div>
    </div>
  );
};

export default React.memo(MessageBubble, (prevProps, nextProps) => {
  return prevProps.message.content === nextProps.message.content &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.isGenerating === nextProps.isGenerating;
});