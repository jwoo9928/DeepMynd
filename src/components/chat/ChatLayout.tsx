import { useEffect, useState, useCallback } from 'react';
import { EVENT_TYPES, eventEmitter } from '../../controllers/events';
import Sidebar from '../Sidebar';
import Chat from './Chat';
import { Mode, ModeValues } from '../types';
import ModelCustomization from '../models/ModelCustomization';
import LoadingProgressModal from './LoadingProgressModal';
import { useRecoilState, useRecoilValue } from 'recoil';
import { uiModeState } from '../../stores/ui.store';
// import { DBController } from '../../controllers/DBController';



const ChatLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mode = useRecoilValue(uiModeState);
  // DBController.getDatabase().delete()

  useEffect(() => {
    // eventEmitter.on(EVENT_TYPES.CREATE_NEW_PERSONA, setMode)

    // return () => {
    //   eventEmitter.off(EVENT_TYPES.CREATE_NEW_PERSONA);
    // };
  }, []);

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
          /> : <ModelCustomization />
        }

      </div>
      <LoadingProgressModal />
    </div>
  );
};

export default ChatLayout