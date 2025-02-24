import { Bot, ChevronLeft, ChevronRight, PlusCircle, X } from "lucide-react";
import React, { useState } from "react";
import Modal from 'react-modal';

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


interface ModelCardsSectionProps {
  models: any[];
  onSelectModel: (modelId: string) => void;
}

const EmptyModelState = () => (
  <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
    <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">Bring Your Own Model</h3>
    <p className="text-sm text-gray-500 mb-4">
      Get started by connecting your own AI model or create a custom one.
    </p>
    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
      <PlusCircle className="w-4 h-4 mr-2" />
      Connect Model
    </button>
  </div>
);

const ModelCardsSection = ({ models, onSelectModel }: ModelCardsSectionProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 2;
  const totalPages = Math.ceil(models.length / itemsPerPage);

  if (!models.length) {
    return <EmptyModelState />;
  }

  if (models.length <= 2) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((model) => (
          <ModelCard
            key={model.id}
            name={model.name}
            description={model.description}
            onClick={() => onSelectModel(model.id)}
          />
        ))}
      </div>
    );
  }

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const currentModels = models.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentModels.map((model) => (
          <ModelCard
            key={model.id}
            name={model.name}
            description={model.description}
            onClick={() => onSelectModel(model.id)}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrevPage}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>
      <button
        onClick={handleNextPage}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>

      {/* Pagination Dots */}
      <div className="flex justify-center space-x-2 mt-4">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index)}
            className={`w-2 h-2 rounded-full transition-all ${currentPage === index ? 'bg-blue-500 w-4' : 'bg-gray-300'
              }`}
          />
        ))}
      </div>
    </div>
  );
};

const NewChatModal = ({ isOpen, onClose, onSelectModel, onCreateModel, onSkip }: {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (model: string) => void;
  onCreateModel: () => void;
  onSkip: () => void;
}) => (
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
        <ModelCardsSection models={[]} onSelectModel={onSelectModel} />

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


export default React.memo(NewChatModal);