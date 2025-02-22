import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, X, Bot, Download } from 'lucide-react';
// import { PersonaController } from '../../controllers/PersonaController';
import { Model, ModelFormat } from './types';
import HuggingfaceModal from './HuggingfaceModal';
import ModelList from './ModelList';

interface ModelCustomizationProps {
  onBack: () => void;
}

const ModelCustomization = ({ onBack }: ModelCustomizationProps) => {
  const [modelName, setModelName] = useState<string>('');
  const [systemInstruction, setSystemInstruction] = useState<string>('');
  const [firstMessage, setFirstMessage] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<ModelFormat>(ModelFormat.ONNX);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [, setIsHuggingfaceModalOpen] = useState(false);
  const [huggingfaceModelId] = useState('');
  const [huggingfaceFileName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [, setSearchQuery] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const personaController = useRef(PersonaController.getInstance());


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfileImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    // 다운로드 시뮬레이션
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setDownloadProgress(i);
    }

    setIsDownloading(false);
    setDownloadProgress(100);
  };

  const handleSubmit = async () => {
    await simulateDownload();
    // personaController.current.createNewPersona(
    //   modelName,
    //   systemInstruction,
    //   profileImage,
    //   // selectedModel,
    //   // firstMessage
    // );
    onBack();
  };

  const handleHuggingfaceImport = async () => {
    const newModel: Model = {
      id: huggingfaceModelId,
      name: huggingfaceModelId.split('/').pop() || '',
      format: selectedFormat,
      size: 'Unknown',
      description: `Imported from Hugging Face: ${huggingfaceFileName}`,
      model_id: ''
    };
    setSelectedModel(newModel);
    setIsHuggingfaceModalOpen(false);
  };


  return (
    <div className="h-screen w-full bg-gray-100">
      <div className="flex h-full">
        <div className="flex-1 flex flex-col h-full">
          {/* Header */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Chat</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-8">
              <h1 className="text-2xl font-bold text-gray-900">Create Custom Persona</h1>

              {/* Profile Image Upload */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Profile Image</h2>
                  <div className="flex items-center space-x-6">
                    <div
                      className="relative w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {profileImage ? (
                        <>
                          <img
                            src={profileImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileImage('');
                            }}
                            className="absolute top-0 right-0 p-1 bg-gray-800 bg-opacity-50 text-white rounded-bl-lg"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <Upload className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-500 hover:text-blue-600 font-medium"
                      >
                        Upload image
                      </button>
                      <p className="text-sm text-gray-500 mt-1">
                        Square image recommended. Max size 1MB.
                      </p>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Model Selection */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Select Model</h2>
                  <div className="space-y-6">
                    {/* Format Tabs */}
                    <div className="flex space-x-4 border-b border-gray-200">
                      {['onnx', 'gguf', 'mlc'].map((format) => (
                        <button
                          key={format}
                          onClick={() => {
                            setSelectedFormat(format as ModelFormat);
                            setSearchQuery('');
                          }}
                          className={`pb-2 px-4 text-sm font-medium transition-colors ${selectedFormat === format
                            ? 'text-blue-500 border-b-2 border-blue-500'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    {/* Model List with Search */}
                    <ModelList
                      selectedFormat={selectedFormat}
                      selectedModel={selectedModel}
                      setSelectedModel={setSelectedModel}
                    />

                    {/* Hugging Face Import Button */}
                    <button
                      onClick={() => setIsHuggingfaceModalOpen(true)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg 
                             hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Bot className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                        <span className="font-medium text-gray-600 group-hover:text-blue-500">
                          Import from Hugging Face
                        </span>
                      </div>
                    </button>

                    {/* Selected Model Info */}
                    {selectedModel && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">Selected Model</h3>
                              <p className="text-sm text-gray-500 mt-1">{selectedModel.name}</p>
                            </div>
                            <button
                              onClick={() => setSelectedModel(null)}
                              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              <X className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Format</span>
                              <p className="font-medium text-gray-900 mt-1">
                                {selectedModel.format.toUpperCase()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Size</span>
                              <p className="font-medium text-gray-900 mt-1">
                                {selectedModel.size}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Source</span>
                              <p className="font-medium text-gray-900 mt-1">
                                {selectedModel.id.includes('/') ? 'Hugging Face' : 'Local Library'}
                              </p>
                            </div>
                          </div>

                          {isDownloading && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Downloading...</span>
                                <span className="text-gray-900 font-medium">{downloadProgress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${downloadProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {downloadProgress === 100 && !isDownloading && (
                            <div className="flex items-center text-sm text-green-600">
                              <Download className="h-4 w-4 mr-1" />
                              Download Complete
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* Model Name */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Persona Name</h2>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="Enter model name..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* System Instructions */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Persona Instructions</h2>
                  <textarea
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                    placeholder="Enter system instructions..."
                    rows={6}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* First Message */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">First Message</h2>
                  <textarea
                    value={firstMessage}
                    onChange={(e) => setFirstMessage(e.target.value)}
                    placeholder="Enter the first message the model will send..."
                    rows={4}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={handleSubmit}
                disabled={!modelName || !systemInstruction || !selectedFormat}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Model
              </button>
            </div>
          </div>
        </div>
      </div>

      <HuggingfaceModal handleHuggingfaceImport={handleHuggingfaceImport} />
    </div>
  );
};

export default ModelCustomization;