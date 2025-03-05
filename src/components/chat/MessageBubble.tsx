import { ChevronUp, ChevronDown, Bot, Loader2 } from "lucide-react";
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
  const [isThinkExpanded, setIsThinkExpanded] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const isImage = message.content.startsWith('/image:');
  console.log("message", message)

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
    )
  };


  const renderContent = () => {
    const content = message.content;

    const parts = content.split('</think>');

    if (isImage == true) {
      return renderImageOrMarkdown()
    }

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
              <ReactMarkdown>{content.replace('<think>', '')}</ReactMarkdown>
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
              <ReactMarkdown>{thinkContent.replace('<think>', '')}</ReactMarkdown>
            </div>
          )}
        </div>

        {normalContent && (
          <ReactMarkdown>{normalContent}</ReactMarkdown>
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
    prevProps.isGenerating === nextProps.isGenerating;
});