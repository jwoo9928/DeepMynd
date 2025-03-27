import { Model, ModelFormat } from "./types";
import ModelList from "./ModelList";
import { X } from "lucide-react";
import React, { useState } from "react";

const ModelSelectionModal = ({
  isOpen,
  onClose,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (model: Model, qType?: string) => void;
}) => {

  if (!isOpen) return null;
  const [selectedFormat, setSelectedFormat] = useState<ModelFormat>(ModelFormat.ONNX);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [quantizationType, setQuantizationType] = useState<string>();

  const handleSelect = (model: Model, qType?: string) => {
    setSelectedModel(model);
    setQuantizationType(qType);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Select Model</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex space-x-4 border-b border-gray-200">
            {['onnx', 'gguf', 'mlc'].map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format as ModelFormat)}
                className={`pb-2 px-4 text-sm font-medium transition-colors ${selectedFormat === format
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>

          <ModelList
            selectedFormat={selectedFormat}
            selectedModel={selectedModel}
            handleSelect={handleSelect}
            quantizationType={quantizationType}
          />

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                selectedModel && onConfirm(selectedModel, quantizationType);
                onClose();
              }}
              disabled={!selectedModel}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ModelSelectionModal)