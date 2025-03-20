import Sidebar from '../Sidebar';
import Chat from './Chat';
import { Mode, ModeValues } from '../types';
import LoadingProgressModal from './LoadingProgressModal';
import PersonaLayout from '../persona/PersonaLayout';
import { useState } from 'react';
import WelcomeChat from './WelcomeSequence';
import { useAtomValue } from 'jotai';
import { uiModeAtom } from '../../stores/ui.store';
// import { DBController } from '../../controllers/DBController';
import ModelCustomization from '../persona/ModelCustomization';
import ChatHeader from './atoms/ChatHeader';
import ModelChangeModal from './ChaningProgressModal';
import LoginModal from '../auth/\bAuthModal';


const ModeScreen = ({
  mode = ModeValues.Import,
}: {
  mode: Mode;
}) => {
  switch (mode) {
    case ModeValues.Welcome:
      return <WelcomeChat />
    case ModeValues.Chat:
      return <Chat />
    case ModeValues.Create:
    case ModeValues.Edit:
      return <ModelCustomization />;
    case ModeValues.Import:
      return <PersonaLayout />
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
        <div className="flex-1 flex flex-col">
          <ChatHeader toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <div className="flex-1 overflow-y-auto">
            <ModeScreen mode={mode} />
          </div>
        </div>
      </div>
      <LoginModal />
      <LoadingProgressModal />
      <ModelChangeModal />
    </div>
  );
};

export default ChatLayout