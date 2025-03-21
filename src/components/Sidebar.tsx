import { Search, X, Plus, MoreVertical, Pin, Trash2, Bot } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EVENT_TYPES, eventEmitter } from "../controllers/events";
import { ModeValues } from "./types";
import { ChatController } from "../controllers/ChatController";
import NewChatModal from "./NewChatModal";
import { ChatRoom } from "../controllers/types";
import LoadingModal from "./models/LoadingModal";
import { useAtom, useSetAtom } from "jotai";
import { uiModeAtom } from "../stores/ui.store";
import UserInfoSection from "./sidebar/UserInfoSection";

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
  revealed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const chatController = useRef(ChatController.getInstance());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>(chatController.current.getChatRooms());
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  const [uiMode, setUIMode] = useAtom(uiModeAtom);
  const [isRemoveStart, setIsRemoveStart] = useState(false);
  const [isRemoveComplete, setIsRemoveComplete] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const setMode = useSetAtom(uiModeAtom);


  // Store dropdown position for proper rendering
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  const removeContents = useMemo(() => ({
    title: "Removing chat Data",
    subTitle: "please wait while we remove the chat data",
    successTitle: "Removed Successfully",
    subSuccessTitle: "The chat data has been removed successfully",
  }), []);

  const [swipeState, setSwipeState] = useState<SwipeState>({
    roomId: null,
    startX: 0,
    currentX: 0,
    swiping: false,
    direction: null,
    revealed: false
  });

  const handleCreateRoomEvent = useCallback((roomId: string) => {
    setRooms(chatController.current.getChatRooms());
    setSelectedRoomId(roomId);
  }, []);

  useEffect(() => {
    setRooms(chatController.current.getChatRooms());
    eventEmitter.on(EVENT_TYPES.UPDATED_CHAT_ROOMS, handleCreateRoomEvent);
    return () => {
      eventEmitter.off(EVENT_TYPES.UPDATED_CHAT_ROOMS, handleCreateRoomEvent);
    };
  }, [handleCreateRoomEvent]);

  useEffect(() => {
    let focusedRoomId = chatController.current.getFocusedRoomId();
    if (selectedRoomId && focusedRoomId) {
      if (focusedRoomId !== selectedRoomId) {
        chatController.current.changeChatRoom(selectedRoomId);
      }
    }
    if (chatController.current.getChatRooms().length <= 0) {
      setMode(ModeValues.Import)
    }
  }, [selectedRoomId]);

  const handleCreateModel = useCallback(() => {
    setUIMode(ModeValues.Create);
    setIsModalOpen(false);
  }, [setUIMode]);

  // Reset swipe state when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (swipeState.revealed &&
        swipeState.roomId &&
        !(e.target as HTMLElement).closest(`[data-room-id="${swipeState.roomId}"]`)) {
        setSwipeState(prev => ({
          ...prev,
          revealed: false,
          swiping: false,
          direction: null
        }));
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [swipeState]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [dropdownOpen]);

  const handleTouchStart = (e: React.TouchEvent, roomId: string) => {
    if (!isDesktop) {
      // If there's already a revealed item, reset it unless it's the same one
      if (swipeState.revealed && swipeState.roomId !== roomId) {
        setSwipeState({
          roomId,
          startX: e.touches[0].clientX,
          currentX: e.touches[0].clientX,
          swiping: true,
          direction: null,
          revealed: false
        });
      } else {
        setSwipeState({
          roomId,
          startX: e.touches[0].clientX,
          currentX: e.touches[0].clientX,
          swiping: true,
          direction: null,
          revealed: swipeState.roomId === roomId ? swipeState.revealed : false
        });
      }
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

      // If already revealed and swiping in opposite direction, close it
      if (swipeState.revealed) {
        const isOppositeDirection =
          (swipeState.direction === 'right' && swipeState.revealed && swipeState.direction !== 'right') ||
          (swipeState.direction === 'left' && swipeState.revealed && swipeState.direction !== 'left');

        if (isOppositeDirection || diff < SWIPE_THRESHOLD / 3) {
          setSwipeState(prev => ({
            ...prev,
            revealed: false,
            swiping: false
          }));
          return;
        }
      }

      // If swiping enough to trigger reveal
      if (diff > SWIPE_THRESHOLD / 2) {
        setSwipeState(prev => ({
          ...prev,
          revealed: true,
          swiping: false
        }));
      } else {
        // Not swiped enough, reset
        setSwipeState(prev => ({
          ...prev,
          revealed: false,
          swiping: false
        }));
      }
    }
  };

  const handleActionButtonClick = (action: 'delete' | 'pin', roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (action === 'delete') {
      handleDeleteRoom(roomId);
    } else {
      handlePinRoom(roomId);
    }

    // Reset swipe state after action
    setSwipeState({
      roomId: null,
      startX: 0,
      currentX: 0,
      swiping: false,
      direction: null,
      revealed: false
    });
  };

  const handleDeleteRoom = useCallback(async (roomId: string) => {
    try {
      setIsRemoveStart(true);
      // Fix: Make sure we properly await the deletion process
      await chatController.current.deleteChatRoom(roomId);

      // Update the rooms list after deletion
      let rooms = chatController.current.getChatRooms();
      setRooms(rooms);
      if (rooms.length <= 0) {
        setMode(ModeValues.Import)
      }

      setIsRemoveComplete(true);
    } catch (error) {
      console.error("Error deleting chat room:", error);
    } finally {
      setTimeout(() => {
        setIsRemoveStart(false);
        setIsRemoveComplete(false);
      }, 2000);
    }
  }, [selectedRoomId]);

  const handlePinRoom = useCallback((roomId: string) => {
    chatController.current.pinHandleChatRoom(roomId);
    // Refresh rooms after pinning
    setRooms(chatController.current.getChatRooms());
  }, []);

  const handleSelectRoom = useCallback((roomId: string, e: React.MouseEvent) => {
    // Don't select if we're clicking on action buttons or if item is revealed
    if ((e.target as HTMLElement).closest('.action-button') ||
      (swipeState.revealed && swipeState.roomId === roomId)) {
      return;
    }

    // Prevent room selection when clicking dropdown
    if ((e.target as HTMLElement).closest('.dropdown-trigger') ||
      (e.target as HTMLElement).closest('.dropdown-content')) {
      return;
    }
    if (uiMode !== ModeValues.Chat) {
      setUIMode(ModeValues.Chat);
    }
    setSelectedRoomId(roomId);
    chatController.current.changeChatRoom(roomId);
    setDropdownOpen(null);
  }, [swipeState, uiMode, setUIMode]);

  // Fix: Calculate and position dropdown correctly
  const handleOpenDropdown = useCallback((e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    e.preventDefault();

    // Get button position
    const button = e.currentTarget.getBoundingClientRect();

    // Position dropdown relative to button
    setDropdownPosition({
      top: button.bottom - button.top + 5,
      right: 12
    });

    setDropdownOpen(dropdownOpen === roomId ? null : roomId);
  }, [dropdownOpen]);

  const getSwipePosition = (roomId: string) => {
    if (swipeState.roomId !== roomId) return 0;

    if (swipeState.revealed) {
      return swipeState.direction === 'left' ? -SWIPE_THRESHOLD : SWIPE_THRESHOLD;
    }

    if (swipeState.swiping) {
      // Limit the swipe to threshold
      return Math.max(
        Math.min(
          swipeState.currentX - swipeState.startX,
          SWIPE_THRESHOLD
        ),
        -SWIPE_THRESHOLD
      );
    }

    return 0;
  };

  // Memoize the dropdown rendering to prevent unnecessary re-renders
  const renderDropdown = useCallback((roomId: string, isPinned: boolean) => {
    if (dropdownOpen !== roomId) return null;

    return (
      <div
        ref={dropdownRef}
        className="dropdown-content absolute bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
        style={{
          top: `${dropdownPosition.top}px`,
          right: `${dropdownPosition.right}px`,
          minWidth: '120px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            handlePinRoom(roomId);
            setDropdownOpen(null);
          }}
          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
        >
          <Pin className="h-4 w-4" />
          {isPinned ? 'Unpin' : 'Pin'}
        </button>
        <button
          onClick={() => {
            handleDeleteRoom(roomId);
            setDropdownOpen(null);
          }}
          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    );
  }, [dropdownOpen, dropdownPosition, handlePinRoom, handleDeleteRoom]);

  // Memoize room items to prevent unnecessary re-renders
  const roomItems = useMemo(() => {
    return rooms.map((room) => {
      const isPinned = room.isPin;
      const isSelected = selectedRoomId === room.roomId;
      const swipeOffset = getSwipePosition(room.roomId);
      const isRevealed = swipeState.revealed && swipeState.roomId === room.roomId;
      const direction = swipeState.direction;

      return (
        <div
          key={room.roomId}
          data-room-id={room.roomId}
          className="relative"
        >
          {/* Action buttons container - positioned absolutely */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-stretch">
            {/* Left action (Pin) */}
            <div
              className={`
                flex items-center justify-center
                bg-blue-500 text-white
                transition-opacity duration-200
                action-button
              `}
              style={{
                width: `${SWIPE_THRESHOLD}px`,
                opacity: isRevealed && direction === 'right' ? 1 : 0,
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0
              }}
              onClick={(e) => handleActionButtonClick('pin', room.roomId, e)}
            >
              <Pin className="h-6 w-6" />
            </div>

            {/* Right action (Delete) */}
            <div
              className={`
                flex items-center justify-center
                bg-red-500 text-white
                transition-opacity duration-200
                action-button
              `}
              style={{
                width: `${SWIPE_THRESHOLD}px`,
                opacity: isRevealed && direction === 'left' ? 1 : 0,
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0
              }}
              onClick={(e) => handleActionButtonClick('delete', room.roomId, e)}
            >
              <Trash2 className="h-6 w-6" />
            </div>
          </div>

          {/* Main room item */}
          <div
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
                  src={URL.createObjectURL(room.image)}
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
                        onClick={(e) => handleOpenDropdown(e, room.roomId)}
                        className="focus:outline-none z-10 dropdown-trigger"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 truncate">Latest message preview...</p>
              </div>
            </div>
          </div>

          {/* Fixed positioning of dropdown in the DOM to prevent overlap */}
          {isDesktop && dropdownOpen === room.roomId && renderDropdown(room.roomId, isPinned)}
        </div>
      );
    });
  }, [rooms, selectedRoomId, swipeState, handleSelectRoom, handleOpenDropdown, renderDropdown, isDesktop, dropdownOpen]);

  // Empty state component when no chats exist
  const EmptyChatState = () => (
    <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <Bot className="h-8 w-8 text-blue-500" />
      </div>
      <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
      <p className="text-gray-500 text-sm mb-6">Start your first chat with DeepMynd AI assistant</p>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Start New Chat
      </button>
    </div>
  );

  // Download apps section
  // const DownloadAppsSection = () => (
  //   <div className="border-t border-gray-200 p-4">
  //     <div className="bg-gray-50 rounded-lg p-4">
  //       <h3 className="text-sm font-medium mb-2">Get DeepMynd apps</h3>
  //       <div className="grid grid-cols-3 gap-2 mt-3">
  //         <a
  //           href="#"
  //           className="flex flex-col items-center justify-center p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
  //         >
  //           <Download className="h-5 w-5 text-blue-500 mb-1" />
  //           <span className="text-xs">Web App</span>
  //         </a>
  //         <a
  //           href="#"
  //           className="flex flex-col items-center justify-center p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
  //         >
  //           <Download className="h-5 w-5 text-blue-500 mb-1" />
  //           <span className="text-xs">Windows</span>
  //         </a>
  //         <a
  //           href="#"
  //           className="flex flex-col items-center justify-center p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
  //         >
  //           <Download className="h-5 w-5 text-blue-500 mb-1" />
  //           <span className="text-xs">macOS</span>
  //         </a>
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <>
      <div
        className={`
          fixed md:relative
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-80 h-full bg-white border-r border-gray-200 flex flex-col
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

        {/* Chat list with empty state */}
        <div className="flex-1 overflow-y-auto">
          {rooms.length > 0 ? roomItems : <EmptyChatState />}
        </div>

        {/* User info section */}
        <UserInfoSection />

        {/* Download apps section */}
        {/* <DownloadAppsSection /> */}
      </div>

      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateModel={handleCreateModel}
      />

      <LoadingModal isOpen={isRemoveStart} isComplete={isRemoveComplete} contents={removeContents} />

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