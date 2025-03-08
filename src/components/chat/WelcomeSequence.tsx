import { Message } from "../../controllers/types";
import ChatHeader from "./atoms/ChatHeader";
import MessageBubble from "./atoms/MessageBubble";
import { useMemo, useState, useEffect, useRef } from "react";
import ChatInput from './atoms/ChatInput';
import TermsModal from "../terms/TermsModal";
import { useSetAtom } from "jotai";
import { isTermsAccepted, uiModeAtom } from "../../stores/ui.store";
import { ModeValues } from "../types";


const welcomeMessages: Message[] = [
    {
        role: 'assistant',
        content: 'Welcome to DeepMynd! 👋',
    },
    {
        role: 'assistant',
        content: 'I am your personal AI assistant, powered by Local LLM technology. This means all our conversations stay private and secure on your device! 🔒',
    },
    {
        role: 'assistant',
        content: 'I can help you with various tasks, from writing and analysis to creative projects and problem-solving. 💡',
    },
    {
        role: 'assistant',
        content: "Ready to start our conversation? Click the button below to begin!",
    }
];

const WelcomeChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(true);
    const [showTerms, setShowTerms] = useState<boolean>(false);
    const setIsTermsAccepted = useSetAtom(isTermsAccepted);
    const setMode = useSetAtom(uiModeAtom);
    const currentMessageIndex = useRef(0);
    const currentCharIndex = useRef(0);
    const streamingInterval = useRef<NodeJS.Timeout | null>(null);


    useEffect(() => {
        //hikr215

    }, []);

    useEffect(() => {
        // 메시지 스트리밍 시작
        startStreaming();

        return () => {
            // 컴포넌트 언마운트 시 인터벌 정리
            if (streamingInterval.current) {
                clearInterval(streamingInterval.current);
            }
        };
    }, []);

    const startStreaming = () => {
        // 첫 번째 메시지로 시작, 빈 내용으로
        setMessages([{ ...welcomeMessages[0], content: '' }]);

        // 일정 간격으로 문자를 하나씩 추가
        streamingInterval.current = setInterval(() => {
            const currentMessage = welcomeMessages[currentMessageIndex.current];
            const fullContent = currentMessage.content;

            if (currentCharIndex.current < fullContent.length) {
                // 현재 메시지에 문자 추가
                setMessages(prevMessages => {
                    const updatedMessages = [...prevMessages];
                    const lastMessageIndex = updatedMessages.length - 1;

                    // 마지막 메시지의 내용 업데이트
                    updatedMessages[lastMessageIndex] = {
                        ...updatedMessages[lastMessageIndex],
                        content: fullContent.substring(0, currentCharIndex.current + 1)
                    };

                    return updatedMessages;
                });

                currentCharIndex.current += 1;
            } else {
                // 현재 메시지 완료, 다음 메시지로 이동
                currentMessageIndex.current += 1;
                currentCharIndex.current = 0;

                // 모든 메시지가 완료되었는지 확인
                if (currentMessageIndex.current < welcomeMessages.length) {
                    // 새 메시지 추가 (빈 내용으로 시작)
                    setMessages(prevMessages => [
                        ...prevMessages,
                        { ...welcomeMessages[currentMessageIndex.current], content: '' }
                    ]);
                } else {
                    // 모든 메시지 스트리밍 완료
                    if (streamingInterval.current) {
                        clearInterval(streamingInterval.current);
                        setIsGenerating(false)
                    }
                }
            }
        }, 30); // 30ms 간격 (속도 조정 가능)
    };



    // messages가 변경될 때만 새 배열을 생성하고, 그렇지 않으면 캐싱된 결과를 사용
    const renderedMessages = useMemo(() => {
        return messages.map((msg, index) => (
            <MessageBubble
                key={index}
                persona={null}
                message={msg}
                isLast={index === messages.length - 1}
                isGenerating={isGenerating}
            />
        ));
    }, [messages]);

    const handleTermsAgree = () => {
        setIsTermsAccepted(true);
        setMode(ModeValues.Import);

    };

    return (
        <div className="flex-1 flex flex-col h-full">
            <ChatHeader toggleSidebar={() => { }} />

            <div className="flex-1 overflow-y-auto bg-gray-50">
                <div className="p-4 space-y-4">
                    {renderedMessages}
                </div>
                {
                !isGenerating &&
                <div className="flex justify-start border-l-2 border-gray-300 pl-16">
                    <button 
                        className="bg-blue-500 text-white px-4 py-2 rounded-md"
                        onClick={() => setShowTerms(true)}
                    >
                        Let's begin!
                    </button>
                </div>
            }
            </div>

            <ChatInput
                inputValue={''}
                setInputValue={() => { }}
                handleKeyPress={() => { }}
                handleSendMessage={() => { }}
                isGenerating={false}
            />
            <TermsModal 
                isOpen={showTerms} 
                onClose={() => setShowTerms(false)}
                onAgree={handleTermsAgree}
            />
        </div>
    )
}

export default WelcomeChat;