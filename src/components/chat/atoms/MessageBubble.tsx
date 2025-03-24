import React, { memo, useState } from "react";
import { Bot, ChevronDown, ChevronUp, Globe } from "lucide-react";
import LoadingDots from "./LoadingDots";
import { Message, Persona } from "../../../controllers/types";
import MessageContent from "./message/MessageContent";

interface MessageBubbleProps {
  mainMessage: Message;
  secondaryMessage: Message | null;
  isLast: boolean;
  isGenerating: boolean;
  persona: Persona | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  mainMessage,
  secondaryMessage,
  isLast,
  isGenerating,
  persona
}) => {
  const [showSecondary, setShowSecondary] = useState(false);

  // Early return for system messages
  if (mainMessage.role === 'system') {
    return null;
  }

  const isUserMessage = mainMessage.role === 'user';
  const hasSecondary = !!secondaryMessage;
  const isTranslation = secondaryMessage?.role === 'ts';
  const isOriginal = secondaryMessage?.role === 'origin';

  // 색상 스타일을 올바르게 설정
  const bubbleClassNames = isUserMessage
    ? 'bg-blue-500 text-white rounded-br-none'
    : 'bg-gray-200 text-gray-900 rounded-tl-none';

  // 메시지가 생성 중일 때만 애니메이션 클래스 추가
  const animationClass = isLast && isGenerating
    ? 'animate-[bubble_0.5s_ease-in-out_infinite]'
    : '';

  const toggleSecondary = () => {
    setShowSecondary(!showSecondary);
  };

  return (
    <div className={`flex flex-col ${isUserMessage ? 'items-end' : 'items-start'} mb-4`}>
      {/* 어시스턴트 메시지일 때만 아바타와 이름 표시 */}
      {!isUserMessage && (
        <div className="flex items-center mb-1">
          {/* 아바타 */}
          <div className="mr-2">
            {persona?.avatar ? (
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
          </div>

          {/* 페르소나 이름 */}
          <span className="text-sm text-gray-600 font-medium">
            {persona?.name ?? 'Assistant'}
          </span>
        </div>
      )}

      {/* 메시지 버블 - 메인 메시지 */}
      <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start ml-6'} w-full`}>
        <div className="max-w-[70%]">
          <div
            className={`
              relative p-3 rounded-2xl 
              ${bubbleClassNames}
              ${animationClass}
            `}
          >
            <MessageContent
              message={mainMessage}
              isGenerating={isGenerating}
              isUserMessage={isUserMessage}
            />

            {isLast && isGenerating && <LoadingDots />}

            {/* Toggle button for secondary message */}
            {hasSecondary && (
              <button
                onClick={toggleSecondary}
                className={`
                  ${isUserMessage ? 'ml-auto' : 'mr-auto'} -bottom-6
                  flex items-center space-x-1 px-2 py-1 rounded-full text-xs
                  ${isUserMessage ? 'bg-blue-400 text-white' : 'bg-gray-300 text-gray-700'}
                  hover:opacity-90 transition-opacity
                `}
              >
                {isTranslation && <Globe className="w-3 h-3" />}
                <span>{isTranslation ? '번역' : isOriginal ? '원문' : '기타'}</span>
                {showSecondary ?
                  <ChevronUp className="w-3 h-3" /> :
                  <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Secondary message - conditionally rendered */}
          {hasSecondary && (
            <div
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${showSecondary ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}
              `}
            >
              <div
                className={`
                  p-3 rounded-2xl border
                  ${isUserMessage ?
                    'bg-blue-100 text-blue-800 border-blue-200' :
                    'bg-gray-100 text-gray-800 border-gray-200'}
                `}
              >
                <MessageContent
                  message={secondaryMessage}
                  isGenerating={false}
                  isUserMessage={isTranslation} // Use the correct styling
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 메모이제이션 비교 함수 - 필요한 속성들만 비교
export default memo(MessageBubble, (prevProps, nextProps) => {
  // For main message
  const mainContentUnchanged = prevProps.mainMessage.content === nextProps.mainMessage.content;
  const mainRoleUnchanged = prevProps.mainMessage.role === nextProps.mainMessage.role;

  // For secondary message - check if both exist and compare
  const secondaryUnchanged =
    (!prevProps.secondaryMessage && !nextProps.secondaryMessage) ||
    (prevProps.secondaryMessage && nextProps.secondaryMessage &&
      prevProps.secondaryMessage.content === nextProps.secondaryMessage.content &&
      prevProps.secondaryMessage.role === nextProps.secondaryMessage.role) || false;

  return (
    mainContentUnchanged &&
    mainRoleUnchanged &&
    secondaryUnchanged &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.isGenerating === nextProps.isGenerating &&
    prevProps.persona === nextProps.persona
  );
});