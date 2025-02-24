import { Search, X, Plus, MoreVertical, Pin, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { EVENT_TYPES, eventEmitter } from "../controllers/events";
import { ModeValues } from "./types";
import { ChatController } from "../controllers/ChatController";
import NewChatModal from "./NewChatModal";
import { ChatRoom } from "../controllers/types";
import { useSetRecoilState } from "recoil";
import { uiModeState } from "../stores/ui.store";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const SWIPE_THRESHOLD = 80;

interface SwipeState {
  roomId: string | null;
  startX: number;
  currentX: number;
  swiping: boolean;
  direction: 'left' | 'right' | null;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const chatController = useRef(ChatController.getInstance());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>(chatController.current.getChatRooms());
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  const setUIMode = useSetRecoilState(uiModeState);

  const [swipeState, setSwipeState] = useState<SwipeState>({
    roomId: null,
    startX: 0,
    currentX: 0,
    swiping: false,
    direction: null
  });

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
    let focusedRoomId = chatController.current.getFocusedRoomId();
    console.log("#0 focusedRoomId: ", focusedRoomId, selectedRoomId);
    if (selectedRoomId && focusedRoomId) {
      if (focusedRoomId !== selectedRoomId) {
        chatController.current.changeChatRoom(selectedRoomId);
      }
    }
  }, [selectedRoomId]);

  const handleSelectModel = useCallback((model: string) => {
    console.log('Selected model:', model);
    setIsModalOpen(false);
  }, []);

  const handleCreateModel = useCallback(() => {
    setIsModalOpen(false);
    console.log('Creating new model');
    setUIMode(ModeValues.Create);
  }, []);

  const onSkip = useCallback(() => {
    setIsModalOpen(false);
    console.log('Skipping model selection');

    chatController.current.createDefaultChatRoom();
  }, []);

  // 터치 핸들러 수정
  const handleTouchStart = (e: React.TouchEvent, roomId: string) => {
    if (!isDesktop) {
      setSwipeState({
        roomId,
        startX: e.touches[0].clientX,
        currentX: e.touches[0].clientX,
        swiping: true,
        direction: null
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeState.swiping) {
      const currentX = e.touches[0].clientX;
      const diff = currentX - swipeState.startX;

      setSwipeState(prev => ({
        ...prev,
        currentX,
        direction: diff > 0 ? 'right' : 'left'
      }));
    }
  };

  const handleTouchEnd = () => {
    if (swipeState.swiping && swipeState.roomId) {
      const diff = Math.abs(swipeState.currentX - swipeState.startX);
      if (diff > SWIPE_THRESHOLD / 2) { // 절반 이상 스와이프 되었을 때 액션 실행
        if (swipeState.direction === 'left') {
          handleDeleteRoom(swipeState.roomId);
        } else if (swipeState.direction === 'right') {
          handlePinRoom(swipeState.roomId);
        }
      }
      setSwipeState({
        roomId: null,
        startX: 0,
        currentX: 0,
        swiping: false,
        direction: null
      });
    }
  };

  const handleDeleteRoom = useCallback((roomId: string) => {
    setRooms(prev => prev.filter(room => room.roomId !== roomId));
    chatController.current.deleteChatRoom(roomId);
  }, []);

  const handlePinRoom = (roomId: string) => {
    chatController.current.pinHandleChatRoom(roomId);
  };

  const handleSelectRoom = (roomId: string, e: React.MouseEvent) => {
    // 드롭다운 클릭 시 방 선택 방지
    if ((e.target as HTMLElement).closest('.dropdown-content')) {
      return;
    }
    setSelectedRoomId(roomId);
    setDropdownOpen(null);
  };

  const renderDropdown = (roomId: string, isPinned: boolean) => {
    if (dropdownOpen !== roomId) return null;

    return (
      <div
        className="dropdown-content absolute right-4 top-12 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => handlePinRoom(roomId)}
          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
        >
          <Pin className="h-4 w-4" />
          {isPinned ? 'Unpin' : 'Pin'}
        </button>
        <button
          onClick={() => handleDeleteRoom(roomId)}
          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    );
  };

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
          {rooms.map((room) => {
            const isPinned = room.isPin;
            const isSelected = selectedRoomId === room.roomId;
            const swipeOffset = swipeState.roomId === room.roomId
              ? Math.max(
                Math.min(
                  swipeState.currentX - swipeState.startX,
                  SWIPE_THRESHOLD
                ),
                -SWIPE_THRESHOLD
              )
              : 0;

            return (
              <div
                key={room.roomId}
                className="relative" // 부모 컨테이너
              >
                {/* 왼쪽 스와이프 시 나타날 삭제 버튼 */}
                <div
                  className={`
                    absolute right-0 top-0 bottom-0 
                    flex items-center justify-center
                    bg-red-500 text-white
                    transition-opacity duration-200
                    ${swipeOffset < -SWIPE_THRESHOLD / 2 ? 'opacity-100' : 'opacity-0'}
                  `}
                  style={{ width: `${SWIPE_THRESHOLD}px` }}
                >
                  <Trash2 className="h-6 w-6" />
                </div>

                {/* 오른쪽 스와이프 시 나타날 고정 버튼 */}
                <div
                  className={`
                    absolute left-0 top-0 bottom-0
                    flex items-center justify-center
                    bg-blue-500 text-white
                    transition-opacity duration-200
                    ${swipeOffset > SWIPE_THRESHOLD / 2 ? 'opacity-100' : 'opacity-0'}
                  `}
                  style={{ width: `${SWIPE_THRESHOLD}px` }}
                >
                  <Pin className="h-6 w-6" />
                </div>
                <div
                  key={room.roomId}
                  className={`
                  relative px-4 py-3 cursor-pointer
                  transition-all duration-200 ease-in-out
                  ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}
                `}
                  style={{
                    transform: `translateX(${swipeOffset}px)`
                  }}
                  onClick={(e) => handleSelectRoom(room.roomId, e)}
                  onTouchStart={(e) => handleTouchStart(e, room.roomId)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full">
                      <img
                        src={room.image}
                        alt="User"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium flex items-center gap-2">
                          {isPinned && <Pin className="h-3 w-3" />}
                          {room.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">12:30 PM</span>
                          {isDesktop && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpen(dropdownOpen === room.roomId ? null : room.roomId);
                              }}
                              className="focus:outline-none"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 truncate">Latest message preview...</p>
                    </div>
                  </div>
                  {renderDropdown(room.roomId, isPinned)}
                </div>
              </div>
            );
          })}
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

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setDropdownOpen(null)}
        />
      )}
    </>
  );
};

export default React.memo(Sidebar);