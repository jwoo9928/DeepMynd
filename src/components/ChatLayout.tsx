import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Menu, X, Send, MoreVertical, Search } from 'lucide-react';
import { ChatController } from '../controllers/ChatController';
import { Message } from '../controllers/types';
import { EVENT_TYPES, eventEmitter } from '../controllers/events';
import Sidebar from './Sidebar';

const LoadingDots = () => {
  const [dots, setDots] = useState('...');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span className="animate-pulse">{dots}</span>;
};

const MessageBubble = ({ message, isLast, isGenerating }: {
  message: Message;
  isLast: boolean;
  isGenerating: boolean;
}) => (
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
      <p>{message.content}{isLast && isGenerating && <LoadingDots />}</p>
    </div>
  </div>
);

const ChatHeader = ({ toggleSidebar }: {
  toggleSidebar: () => void;
}) => (
  <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
    <div className="flex items-center space-x-4">
      <button className="md:hidden" onClick={toggleSidebar}>
        <Menu className="h-6 w-6 text-gray-600" />
      </button>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        <h2 className="font-medium">Current Chat</h2>
      </div>
    </div>
    <button>
      <MoreVertical className="h-6 w-6 text-gray-600" />
    </button>
  </div>
);



const ChatLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [roomId, setRoomId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const chatController = useRef(ChatController.getInstance());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const roomId = chatController.current.createChatRoom();
    chatController.current.initializeEventListeners(roomId);
    setRoomId(roomId);

    const handleMessageReceived = (updatedMessages: Message[]) => {
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

    return () => {
      chatController.current.removeEventListeners();
      eventEmitter.off(EVENT_TYPES.CHAT_MESSAGE_RECEIVED);
      eventEmitter.off(EVENT_TYPES.GENERATION_START);
      eventEmitter.off(EVENT_TYPES.GENERATION_COMPLETE);
    };
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || !roomId) return;
    chatController.current.sendMessage(roomId, inputValue.trim());
    setInputValue('');
  }, [inputValue, roomId]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div className="h-screen w-full bg-gray-100">
      <div className="flex h-full">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 flex flex-col h-full">
          <ChatHeader toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <MessageBubble
                key={index}
                message={msg}
                isLast={index === messages.length - 1}
                isGenerating={isGenerating}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none"
              />
              <button
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSendMessage}
                disabled={isGenerating || !inputValue.trim()}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatLayout);