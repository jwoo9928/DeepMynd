import { Bot, ChevronLeft, ChevronRight, PlusCircle, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import Modal from 'react-modal';
import { useSetRecoilState } from "recoil";
import { Mode, ModeValues } from "./types";
import { uiModeState } from "../stores/ui.store";

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


const EmptyModelState = ({ onCreateModel }: { onCreateModel: () => void }) => (
  <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
    <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">Create Your Own Persona</h3>
    <p className="text-sm text-gray-500 mb-4">
      Get started by connecting AI model and create a custom Persona.
    </p>
    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      onClick={onCreateModel}>
      <PlusCircle className="w-4 h-4 mr-2" />
      Connect Model
    </button>
  </div>
);

const NewChatModal = ({ isOpen, onClose, onCreateModel }: {
  isOpen: boolean;
  onClose: () => void;
  onCreateModel: () => void;
}) => {
  const setMode = useSetRecoilState<Mode>(uiModeState);

  const goToSelectPage = useCallback(() => {
    onClose();
    setMode(ModeValues.Import);
  }, []);

  return (
    //@ts-ignore
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyles}
      closeTimeoutMS={300}
      appElement={document.getElementById('root') || undefined}
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
          <EmptyModelState onCreateModel={onCreateModel} />;

          <div className="mt-6 border-t border-gray-200 pt-6">
            <button
              onClick={goToSelectPage}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg 
                       hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center justify-center space-x-2">
                <PlusCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                <span className="font-medium text-gray-600 group-hover:text-blue-500">
                  Select new Persona
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          Skip
        </button>
      </div> */}
      </div>
    </Modal>
  )
};


export default React.memo(NewChatModal);