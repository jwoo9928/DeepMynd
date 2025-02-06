import { Search, X, Plus } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Modal from 'react-modal';
import { EVENT_TYPES, eventEmitter } from "../controllers/events";
import { ModeValues } from "./types";
import { ChatController } from "../controllers/ChatController";
import NewChatModal from "./NewChatModal";

// Modal을 앱의 루트에 바인딩
Modal.setAppElement('#root');

const Sidebar = ({ isOpen, toggleSidebar }: {
  isOpen: boolean;
  toggleSidebar: () => void;
}) => {
  const chatController = useRef(ChatController.getInstance());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState(chatController.current.getChatRooms());

  const handleCreateRoomEvent = useCallback((roomId: string) => {
    setRooms(chatController.current.getChatRooms());
    setSelectedRoomId(roomId);
  }, []);

  useEffect(() => {
    eventEmitter.on(EVENT_TYPES.CREATE_NEW_CHAT, handleCreateRoomEvent);
    return () => {
      eventEmitter.off(EVENT_TYPES.CREATE_NEW_CHAT, handleCreateRoomEvent);
    };
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      chatController.current.changeChatRoom(selectedRoomId);
    }
  }, [selectedRoomId]);


  const handleSelectModel = useCallback((model: string) => {
    console.log('Selected model:', model);
    setIsModalOpen(false);
  }, []);

  const handleCreateModel = useCallback(() => {
    setIsModalOpen(false);
    console.log('Creating new model');
    eventEmitter.emit(EVENT_TYPES.CREATE_NEW_PERSONA, ModeValues.Create);
  }, []);

  const onSkip = useCallback(() => {
    setIsModalOpen(false);
    console.log('Skipping model selection');

    chatController.current.createDefaultChatRoom();
  }, []);

  return (
    <>
      <div
        className={`
          fixed md:relative
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-80 h-full bg-white border-r border-gray-200
          transition-transform duration-300 ease-in-out z-20
        `}
      >
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Messages</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              aria-label="New Chat"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button className="md:hidden" onClick={toggleSidebar}>
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full outline-none"
            />
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-8rem)]">
          {rooms.map((room, i) => (
            <div key={room.roomId} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">User {i}</h3>
                    <span className="text-xs text-gray-500">12:30 PM</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">Latest message preview...</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectModel={handleSelectModel}
        onCreateModel={handleCreateModel}
        onSkip={onSkip}
      />

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default React.memo(Sidebar);