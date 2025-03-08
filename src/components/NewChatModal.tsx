import { Bot, ChevronRight, PlusCircle, X } from "lucide-react";
import React, { useCallback } from "react";
import Modal from 'react-modal';
import { ModeValues } from "./types";
import { useSetAtom } from "jotai";
import { uiModeAtom } from "../stores/ui.store";

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

const NewChatModal = ({ isOpen, onClose, onCreateModel }: {
  isOpen: boolean;
  onClose: () => void;
  onCreateModel: () => void;
}) => {
  const setMode = useSetAtom(uiModeAtom);

  const goToSelectPage = useCallback(() => {
    onClose();
    setMode(ModeValues.Import);
  }, [onClose, setMode]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyles}
      closeTimeoutMS={300}
      appElement={document.getElementById('root') || undefined}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">New Chat</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>
        
        <p className="text-gray-500 text-sm mb-6">Choose how you want to start your chat</p>

        <div className="space-y-4 flex-1">
          <div 
            className="flex flex-col items-center p-6 border rounded-xl bg-white hover:shadow-md transition-all cursor-pointer hover:border-blue-500"
            onClick={goToSelectPage}
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select Persona</h3>
            <p className="text-sm text-gray-500 text-center mb-3">
              Choose from existing AI personas
            </p>
            <div className="flex items-center text-blue-500 font-medium">
              <span>Browse personas</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          <div 
            className="flex flex-col items-center p-6 border rounded-xl bg-white hover:shadow-md transition-all cursor-pointer hover:border-purple-500"
            onClick={onCreateModel}
          >
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <PlusCircle className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Persona</h3>
            <p className="text-sm text-gray-500 text-center mb-3">
              Design a custom AI persona for your needs
            </p>
            <div className="flex items-center text-purple-500 font-medium">
              <span>Create now</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(NewChatModal);