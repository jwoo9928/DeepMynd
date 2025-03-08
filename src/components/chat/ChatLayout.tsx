import Sidebar from '../Sidebar';
import Chat from './Chat';
import { Mode, ModeValues } from '../types';
import LoadingProgressModal from './LoadingProgressModal';
import PersonaLayout from '../persona/PersonaLayout';
import { useState } from 'react';
import WelcomeChat from './WelcomeSequence';
import { useAtomValue } from 'jotai';
import { uiModeAtom } from '../../stores/ui.store';
import { DBController } from '../../controllers/DBController';
import AppTour from '../tour/AppTour';
import ModelCustomization from '../persona/ModelCustomization';


const ModeScreen = ({
  mode = ModeValues.Import,
  isSidebarOpen,
  setIsSidebarOpen
}: {
  mode: Mode;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}) => {
  switch (mode) {
    case ModeValues.Welcome:
      return <WelcomeChat />
    case ModeValues.Chat:
      return <Chat
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
    case ModeValues.Create:
      return <ModelCustomization />;
    case ModeValues.Import:
      return <PersonaLayout
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />;
  }
}



const ChatLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const mode = useAtomValue(uiModeAtom);
  // DBController.getDatabase().delete()



  return (
    <div className="h-screen w-full bg-gray-100">
      <div className="flex h-full">
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <ModeScreen mode={mode} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      </div>
      <LoadingProgressModal />
    </div>
  );
};

export default ChatLayout