import React, { memo } from "react";
import { Bot } from "lucide-react";
import LoadingDots from "./LoadingDots";
import { Message, Persona } from "../../../controllers/types";
import MessageContent from "./message/MessageContent";

interface MessageBubbleProps {
    message: Message;
    isLast: boolean;
    isGenerating: boolean;
    persona: Persona | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isLast,
    isGenerating,
    persona
}) => {
    // Early return for system messages
    if (message.role === 'system') {
        return null;
    }

    const isUserMessage = message.role === 'user';

    // 색상 스타일을 올바르게 설정
    const bubbleClassNames = isUserMessage
        ? 'bg-blue-500 text-white rounded-br-none'
        : 'bg-gray-200 text-gray-900 rounded-tl-none';

    // 메시지가 생성 중일 때만 애니메이션 클래스 추가
    const animationClass = isLast && isGenerating
        ? 'animate-[bubble_0.5s_ease-in-out_infinite]'
        : '';

    return (
        <div className={`flex flex-col ${isUserMessage ? 'items-end' : 'items-start'} mb-4`}>
            {/* 어시스턴트 메시지일 때만 아바타와 이름 표시 */}
            {!isUserMessage && (
                <div className="flex items-center mb-1">
                    {/* 아바타 */}
                    <div className="mr-2">
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
                    </div>

                    {/* 페르소나 이름 */}
                    <span className="text-sm text-gray-600 font-medium">
                        {persona?.name ?? 'Assistant'}
                    </span>
                </div>
            )}

            {/* 메시지 버블 */}
            <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start ml-6'} w-full`}>
                <div
                    className={`
            max-w-[70%] p-3 rounded-2xl 
            ${bubbleClassNames}
            ${animationClass}
          `}
                >
                    <MessageContent
                        message={message}
                        isGenerating={isGenerating}
                        isUserMessage={isUserMessage}
                    />

                    {isLast && isGenerating && <LoadingDots />}
                </div>
            </div>
        </div>
    );
};

// 메모이제이션 비교 함수 - 필요한 속성들만 비교
export default memo(MessageBubble, (prevProps, nextProps) => {
    // 메시지 역할은 절대 변경되지 않으므로 내용만 비교
    const contentUnchanged = prevProps.message.content === nextProps.message.content;
    const roleUnchanged = prevProps.message.role === nextProps.message.role;

    return (
        contentUnchanged &&
        roleUnchanged &&
        prevProps.isLast === nextProps.isLast &&
        prevProps.isGenerating === nextProps.isGenerating &&
        prevProps.persona === nextProps.persona
    );
});