import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Menu, X, Send, MoreVertical, Search } from 'lucide-react';
import { ChatController } from '../../controllers/ChatController';
import { Message } from '../../controllers/types';
import { EVENT_TYPES, eventEmitter } from '../../controllers/events';
import Sidebar from '../Sidebar';
import Chat from './Chat';
import { Mode, ModeValues } from '../types';
import ModelCustomization from '../ModelCustomization';



const ChatLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [mode,setMode] = useState<Mode>(ModeValues.Chat);
  const chatController = useRef(ChatController.getInstance());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    // const roomId = chatController.current.createChatRoom();
    chatController.current.initializeEventListeners();

    const handleMessageReceived = (updatedMessages: Message[]) => {
      console.log('recieved', updatedMessages[updatedMessages.length - 1].content);
      setMessages(updatedMessages);
      scrollToBottom();
    };

    const handleGenerationStart = () => {
      setIsGenerating(true);
    };

    const handleGenerationComplete = () => {
      setIsGenerating(false);
    };

    eventEmitter.on(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, handleMessageReceived);
    eventEmitter.on(EVENT_TYPES.GENERATION_START, handleGenerationStart);
    eventEmitter.on(EVENT_TYPES.GENERATION_COMPLETE, handleGenerationComplete);
    eventEmitter.on(EVENT_TYPES.CREATE_NEW_PERSONA, setMode)

    return () => {
      chatController.current.removeEventListeners();
      eventEmitter.off(EVENT_TYPES.CHAT_MESSAGE_RECEIVED);
      eventEmitter.off(EVENT_TYPES.GENERATION_START);
      eventEmitter.off(EVENT_TYPES.GENERATION_COMPLETE);
      eventEmitter.off(EVENT_TYPES.CREATE_NEW_PERSONA);
    };
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;
    chatController.current.sendMessage(inputValue.trim());
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

  useEffect(() => {
    console.log("mode", mode) 
  }
  ,[mode])

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
          /> : <ModelCustomization onBack={onBack} />
        }

      </div>
    </div>
  );
};

export default ChatLayout