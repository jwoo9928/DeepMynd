import Sidebar from '../Sidebar';
import Chat from './Chat';
import { Mode, ModeValues } from '../types';
import ModelCustomization from '../models/ModelCustomization';
import LoadingProgressModal from './LoadingProgressModal';
import { useRecoilValue } from 'recoil';
import { uiModeState } from '../../stores/ui.store';
import PersonaLayout from '../persona/PersonaLayout';
import { useState } from 'react';
// import { DBController } from '../../controllers/DBController';


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
  const mode = useRecoilValue(uiModeState);
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