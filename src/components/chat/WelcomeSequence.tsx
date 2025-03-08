import { Code, PenTool, Coffee, MessageSquare } from "lucide-react";
import { Message } from "../../controllers/types";
import ChatHeader from "./atoms/ChatHeader";
import MessageBubble from "./atoms/MessageBubble";
import React, { useMemo, useState, useEffect, useRef } from "react";
import ChatInput from './atoms/ChatInput';
import { useSetAtom } from "jotai";
import { isTermsAccepted, uiModeAtom } from "../../stores/ui.store";
import { ModeValues } from "../types";
import TermsModal from "../terms/TermsModal";
import { userInfoAtom } from "../../stores/data.store";

// 시간대별 인사말 생성 함수
const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

// 상수로 정의된 메시지 배열들
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
        content: 'What can I assist you with today? Feel free to ask me anything or choose from the suggestions below. 🚀',
    },
    {
        role: 'assistant',
        content: `${getTimeBasedGreeting()}! What's your name? 😊 \nPlease enter your name!`,
    }
];

const nameMessages: Message[] = [
    {
        role: 'assistant',
        content: `Nice to meet you! What would you like to talk about today?`
    },
];

const agreementMessages: Message[] = [
    {
        role: 'assistant',
        content: "Great! Ready to start our conversation? Click the button below to begin! ✨",
    },
];

// 시작 프롬프트 옵션
const promptSuggestions = [
    {
        icon: <PenTool size={18} />,
        text: "Help me write something",
        prompt: "I need help writing a professional email to a client about a project delay."
    },
    {
        icon: <Code size={18} />,
        text: "Analyze some code",
        prompt: "Can you explain how this React useEffect hook works and suggest improvements?"
    },
    {
        icon: <Coffee size={18} />,
        text: "Creative brainstorming",
        prompt: "I need ideas for a new mobile app that helps people develop healthy habits."
    },
    {
        icon: <MessageSquare size={18} />,
        text: "Just chat",
        prompt: "Let's have a conversation. What can you tell me about yourself?"
    }
];

// 대화 단계를 enum으로 정의
enum ChatStage {
    WELCOME,      // 초기 환영 메시지
    NAME_INPUT,   // 사용자 이름 입력 대기
    NAME_MESSAGE, // 이름 환영 메시지
    SUGGESTION,   // 제안 옵션 보여주기
    AGREEMENT     // 대화 시작 동의
}

const WelcomeChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [chatStage, setChatStage] = useState<ChatStage>(ChatStage.WELCOME);
    const [showTerms, setShowTerms] = useState<boolean>(false);
    const setIsTermsAccepted = useSetAtom(isTermsAccepted);
    const setMode = useSetAtom(uiModeAtom);
    const setName = useSetAtom(userInfoAtom);

    const currentMessageIndex = useRef(0);
    const currentCharIndex = useRef(0);
    const streamingInterval = useRef<NodeJS.Timeout | null>(null);

    // 컴포넌트 마운트 시 환영 메시지 시작
    useEffect(() => {
        streamMessages(welcomeMessages, () => {
            setChatStage(ChatStage.NAME_INPUT);
        });

        return () => {
            // 컴포넌트 언마운트 시 인터벌 정리
            if (streamingInterval.current) {
                clearInterval(streamingInterval.current);
            }
        };
    }, []);

    // 메시지 스트리밍을 위한 범용 함수
    const streamMessages = (messagesToStream: Message[], onComplete?: () => void) => {
        // 상태 초기화
        currentMessageIndex.current = 0;
        currentCharIndex.current = 0;
        setIsGenerating(true);

        streamingInterval.current = setInterval(() => {
            // 이미 모든 메시지를 끝까지 스트리밍했으면 종료
            if (currentMessageIndex.current >= messagesToStream.length) {
                if (streamingInterval.current) {
                    clearInterval(streamingInterval.current);
                }
                setIsGenerating(false);
                onComplete?.();
                return;
            }

            // 현재 처리 중인 메시지 가져오기
            let currentMessage = { ...messagesToStream[currentMessageIndex.current] };

            // // nameMessages라면 사용자 이름 삽입
            // if (messagesToStream === nameMessages) {
            //     currentMessage.content = currentMessage.content.replace("${''}", userName);
            // }

            const fullContent = currentMessage.content ?? "";

            // 만약 메시지 내용이 아예 비었다면(길이가 0) => 그냥 다음 메시지로 넘어감
            if (!fullContent.length) {
                currentMessageIndex.current += 1;
                return;
            }

            // 아직 한 글자도 찍지 않았다면(== 이 메시지를 배열에 추가하지 않았다면)
            if (currentCharIndex.current === 0) {
                // 첫 글자를 포함해서 메시지를 추가
                setMessages(prev => [
                    ...prev,
                    {
                        ...currentMessage,
                        content: fullContent.substring(0, 1),
                    },
                ]);
                currentCharIndex.current = 1;
            }
            // 이미 첫 글자는 찍었지만 아직 전체 길이에 도달하지 않았다면
            else if (currentCharIndex.current < fullContent.length) {
                // 마지막 메시지(방금 추가된 메시지)에 글자를 하나 더 추가
                setMessages(prev => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;

                    updated[lastIndex] = {
                        ...updated[lastIndex],
                        content: fullContent.substring(0, currentCharIndex.current + 1),
                    };

                    return updated;
                });
                currentCharIndex.current += 1;
            }
            // 전체 길이만큼 다 쳤다면, 다음 메시지로 이동
            else {
                currentMessageIndex.current += 1;
                currentCharIndex.current = 0;
            }
        }, 30); // 30ms 간격 (속도 조절 가능)
    };


    // 사용자 메시지 전송 핸들러
    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const newMessage: Message = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
        setShowSuggestions(false);

        // 현재 대화 단계에 따른 처리
        switch (chatStage) {
            case ChatStage.NAME_INPUT:
                // 이름 입력 처리
                setName({
                    name: inputValue,
                });

                // 잠시 대기 후 nameMessages 시작
                setTimeout(() => {
                    streamMessages(nameMessages, () => {
                        setChatStage(ChatStage.SUGGESTION);
                        setShowSuggestions(true);
                    });
                }, 500);

                setChatStage(ChatStage.NAME_MESSAGE);
                break;

            case ChatStage.SUGGESTION:
                // 제안 선택 후 agreement 메시지 표시
                setTimeout(() => {
                    streamMessages(agreementMessages, () => {
                        setChatStage(ChatStage.AGREEMENT);
                        setShowSuggestions(false);
                    });
                }, 500);

                setChatStage(ChatStage.AGREEMENT);
                break;

            default:
                // 기타 상황에서의 처리
                break;
        }
    };

    // 프롬프트 선택 핸들러
    const handleSelectPrompt = (prompt: string) => {
        setInputValue(prompt);
        setShowSuggestions(false);
    };

    // 키 입력 핸들러
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleTermsAgree = () => {
        setIsTermsAccepted(true);
        setMode(ModeValues.Import);

    };

    // 메시지 렌더링
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
    }, [messages, isGenerating]);

    // 제안 표시 여부 결정
    const shouldShowSuggestions = showSuggestions &&
        (chatStage === ChatStage.NAME_INPUT || chatStage === ChatStage.SUGGESTION);

    return (
        <div className="flex-1 flex flex-col h-full">
            <ChatHeader toggleSidebar={() => { }} />

            <div className="flex-1 overflow-y-auto bg-gray-50">
                <div className="p-4 space-y-4">
                    {renderedMessages}
                </div>
                {(chatStage == ChatStage.AGREEMENT && !isGenerating) &&
                    <div className="flex justify-start border-l-2 border-gray-300 pl-16">
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-md"
                            onClick={() => setShowTerms(true)}
                        >
                            Let's begin!
                        </button>
                    </div>}
            </div>

            {/* Prompt suggestions */}
            {shouldShowSuggestions && (
                <div className={`p-3 bg-white border-t animate-slideUp`}>
                    <p className="text-sm mb-2 font-medium">Try asking about:</p>
                    <div className="flex flex-wrap gap-2">
                        {promptSuggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelectPrompt(suggestion.prompt)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors bg-gray-100 hover:bg-gray-200 text-gray-800"
                            >
                                {suggestion.icon}
                                {suggestion.text}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <ChatInput
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleKeyPress={handleKeyPress}
                handleSendMessage={handleSendMessage}
                isGenerating={isGenerating}
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