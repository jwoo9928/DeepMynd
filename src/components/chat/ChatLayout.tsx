import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChatController } from '../../controllers/ChatController';
import { Message } from '../../controllers/types';
import { EVENT_TYPES, eventEmitter } from '../../controllers/events';
import Sidebar from '../Sidebar';
import Chat from './Chat';
import { Mode, ModeValues } from '../types';
import ModelCustomization from '../models/ModelCustomization';
import { prebuiltAppConfig } from '@mlc-ai/web-llm';
import { LLMController } from '../../controllers/LLMController';
import LoadingProgressModal from './LoadingProgressModal';



const ChatLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<Mode>(ModeValues.Chat);
  const chatController = useRef(ChatController.getInstance());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [boost, setBoost] = useState<boolean>(false);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      // 메시지 컨테이너의 아래쪽 위치가 화면 하단에 있는지 확인
      const isScrolledToBottom = messagesEndRef.current.getBoundingClientRect().bottom <= window.innerHeight;

      // 사용자가 이미 화면 하단에 있을 경우에만 스크롤을 맨 아래로 내림
      if (isScrolledToBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  useEffect(() => {
    // chatController.current.initializeEventListeners();
    const handleMessageReceived = (updatedMessages: Message[]) => {
      setMessages([...updatedMessages]);
      scrollToBottom();
    };

    const handleGenerationStart = () => {
      setIsGenerating(true);
    };

    const handleGenerationComplete = () => {
      setIsGenerating(false);
    };

    // eventEmitter.on(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, handleMessageReceived);
    // eventEmitter.on(EVENT_TYPES.GENERATION_START, handleGenerationStart);
    // eventEmitter.on(EVENT_TYPES.GENERATION_COMPLETE, handleGenerationComplete);
    eventEmitter.on(EVENT_TYPES.CREATE_NEW_PERSONA, setMode)

    return () => {
      // eventEmitter.off(EVENT_TYPES.CHAT_MESSAGE_RECEIVED);
      // eventEmitter.off(EVENT_TYPES.GENERATION_START);
      // eventEmitter.off(EVENT_TYPES.GENERATION_COMPLETE);
      eventEmitter.off(EVENT_TYPES.CREATE_NEW_PERSONA);
      // chatController.current.removeEventListeners();
    };
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;
    chatController.current.sendMessage(inputValue.trim(), boost);
    setInputValue('');
  }, [inputValue]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const onBack = useCallback(() => {
    setMode(ModeValues.Chat)
  }, [])

  return (
    <div className="h-screen w-full bg-gray-100">
      <div className="flex h-full">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        {
          mode == ModeValues.Chat && messages ? <Chat
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            messages={messages}
            isGenerating={isGenerating}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSendMessage={handleSendMessage}
            handleKeyPress={handleKeyPress}
            messagesEndRef={messagesEndRef}
            setBoost={setBoost}
            boost={boost}
          /> : <ModelCustomization onBack={onBack} />
        }

      </div>
      <LoadingProgressModal />
    </div>
  );
};

export default ChatLayout