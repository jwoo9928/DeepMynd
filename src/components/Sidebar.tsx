import { Search, X, Plus, Bot, PlusCircle, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import Modal from 'react-modal';

// Modal을 앱의 루트에 바인딩
Modal.setAppElement('#root');

const modalStyles: Modal.Styles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    position: 'relative',
    top: 'auto',
    left: 'auto',
    right: 'auto',
    bottom: 'auto',
    width: '70%',
    maxWidth: '42rem',
    maxHeight: '90vh',
    padding: '1.5rem',
    border: 'none',
    borderRadius: '0.75rem',
    backgroundColor: 'white',
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  }
};

const ModelCard = ({ name, description, onClick }: {
  name: string;
  description: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-all group"
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-2">
        <Bot className="w-5 h-5 text-blue-500" />
        <h3 className="font-medium">{name}</h3>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
    </div>
    <p className="text-sm text-gray-500">{description}</p>
  </div>
);

const NewChatModal = ({ isOpen, onClose, onSelectModel, onCreateModel, onSkip }: {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (model: string) => void;
  onCreateModel: () => void;
  onSkip: () => void;
}) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onClose}
    style={modalStyles}
    closeTimeoutMS={300}
  >
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Start New Chat</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
        </button>
      </div>

      <div className="space-y-4 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModelCard
            name="GPT-4"
            description="Advanced language model for complex tasks"
            onClick={() => onSelectModel('gpt4')}
          />
          <ModelCard
            name="Claude"
            description="Helpful assistant for general tasks"
            onClick={() => onSelectModel('claude')}
          />
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <button
            onClick={onCreateModel}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg 
                     hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center justify-center space-x-2">
              <PlusCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
              <span className="font-medium text-gray-600 group-hover:text-blue-500">
                Create Custom Model
              </span>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  </Modal>
);

const Sidebar = ({ isOpen, toggleSidebar }: {
  isOpen: boolean;
  toggleSidebar: () => void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectModel = (model) => {
    console.log('Selected model:', model);
    setIsModalOpen(false);
  };

  const handleCreateModel = () => {
    console.log('Creating new model');
    setIsModalOpen(false);
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
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
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
        onSkip={() => setIsModalOpen(false)}
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