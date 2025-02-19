import { useEffect, useRef, useState, useCallback } from 'react';
import { ChatController } from '../../controllers/ChatController';
import { EVENT_TYPES, eventEmitter } from '../../controllers/events';
import Sidebar from '../Sidebar';
import Chat from './Chat';
import { Mode, ModeValues } from '../types';
import ModelCustomization from '../models/ModelCustomization';
import LoadingProgressModal from './LoadingProgressModal';



const ChatLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(ModeValues.Chat);

  useEffect(() => {
    eventEmitter.on(EVENT_TYPES.CREATE_NEW_PERSONA, setMode)

    return () => {
      eventEmitter.off(EVENT_TYPES.CREATE_NEW_PERSONA);
    };
  }, []);

  const onBack = useCallback(() => {
    setMode(ModeValues.Chat)
  }, [])

  return (
    <div className="h-screen w-full bg-gray-100">
      <div className="flex h-full">
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        {
          mode == ModeValues.Chat ? <Chat
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          /> : <ModelCustomization onBack={onBack} />
        }

      </div>
      <LoadingProgressModal />
    </div>
  );
};

export default ChatLayout