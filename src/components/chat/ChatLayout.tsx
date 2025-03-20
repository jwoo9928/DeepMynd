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
import LoginPrompt from '../auth/LoginPrompt';
import ManagePersonas from '../persona/ManagePersonas';


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
    case ModeValues.Manage:
      return <ManagePersonas />
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
      <LoginPrompt
        message="Log in to change or create new Personas! Unlock the full potential of UniMynd with a personalized experience."
      />
      <LoadingProgressModal />
      <ModelChangeModal />
    </div>
  );
};

export default ChatLayout