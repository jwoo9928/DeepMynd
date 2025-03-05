import React, { useState, useRef, useMemo } from 'react';
import { ArrowLeft, Upload, X, Bot, Download } from 'lucide-react';
import { Model, ModelFormat } from './types';
import { useSetRecoilState } from 'recoil';
import { uiModeState } from '../../stores/ui.store';
import { ModeValues } from '../types';
import { PersonaController } from '../../controllers/PersonaController';
import { FastAverageColor } from 'fast-average-color';
import ModelSelectionModal from './ModelSelectionModal';
import LoadingModal from './LoadingModal';
import { NewPersona, Persona } from '../../controllers/types';


const ModelCustomization = () => {
  const [name, setName] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [systemInstruction, setSystemInstruction] = useState<string>();
  const [firstMessage, setFirstMessage] = useState<string>();
  const [profileImage, setProfileImage] = useState<string>();
  const [profileColor, setProfileColor] = useState<string>();

  const [selectedFormat, setSelectedFormat] = useState<ModelFormat>(ModelFormat.ONNX);
  const [selectedTextModel, setSelectedTextModel] = useState<Model | null>(null);
  const [selectedImageModel, setSelectedImageModel] = useState<Model | null>(null);
  const [isTextModelModalOpen, setIsTextModelModalOpen] = useState(false);
  const [isImageModelModalOpen, setIsImageModelModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setUIMode = useSetRecoilState(uiModeState);
  const personaController = useRef(PersonaController.getInstance());
  const fastAverageColor = new FastAverageColor();

  const modalContents = useMemo(() => ({
    title: 'Creating Persona...',
    subTitle: 'Please wait a moment',
    successTitle: 'Persona Created!',
    subSuccessTitle: 'Your new persona is ready to use'
  }), [])


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          let image = reader.result;
          fastAverageColor.getColorAsync(image).then(color => {
            setProfileColor(color.hex);
          });
          setProfileImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // const simulateDownload = async () => {
  //   setIsDownloading(true);
  //   setDownloadProgress(0);

  //   // 다운로드 시뮬레이션
  //   for (let i = 0; i <= 100; i += 5) {
  //     await new Promise(resolve => setTimeout(resolve, 200));
  //     setDownloadProgress(i);
  //   }

  //   setIsDownloading(false);
  //   setDownloadProgress(100);
  // };

  const onBack = () => {
    setUIMode(ModeValues.Chat);
    setIsLoading(false)
  };

  const handleSubmit = async () => {
    setIsLoading(true)
    if (name && selectedTextModel && systemInstruction && description && profileColor) {
      const persona: NewPersona = {
        name,
        description,
        system: systemInstruction,
        first_message: firstMessage,
        avatar: profileImage,
        model_id: selectedTextModel.id,
        model_type: selectedTextModel.format,
        producer: 'local',
        color: profileColor,

      };
      await personaController.current.createNewPersona(persona);
      onBack();
    } else {
      throw new Error('No model selected');
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Create my own persona</h1>

              {/* Profile Image Upload */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Profile Image</h2>
                  <div className="flex items-center space-x-6">
                    <div
                      className="relative w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer border-2"
                      style={{ borderColor: profileColor }}
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

              {/* Model Selection Cards */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Select Models</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Text Generation Model Card */}
                    <div
                      onClick={() => setIsTextModelModalOpen(true)}
                      className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">Text Generation Model</h3>
                          {selectedTextModel ? (
                            <p className="text-sm text-gray-500 mt-1">{selectedTextModel.name}</p>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">Click to select model</p>
                          )}
                        </div>
                        {selectedTextModel && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTextModel(null);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full"
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Image Generation Model Card */}
                    <div
                      onClick={() => setIsImageModelModalOpen(true)}
                      className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">Image Generation Model</h3>
                          {selectedImageModel ? (
                            <p className="text-sm text-gray-500 mt-1">{selectedImageModel.name}</p>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">Click to select model</p>
                          )}
                        </div>
                        {selectedImageModel && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImageModel(null);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full"
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Model Name */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Persona Name</h2>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter model name..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">description</h2>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                disabled={!name || !systemInstruction || !selectedFormat}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create own persona
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ModelSelectionModal
        isOpen={isTextModelModalOpen}
        onClose={() => setIsTextModelModalOpen(false)}
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        selectedModel={selectedTextModel}
        setSelectedModel={setSelectedTextModel}
        onConfirm={() => { }}
      />

      {/* <ModelSelectionModal
        isOpen={isImageModelModalOpen}
        onClose={() => setIsImageModelModalOpen(false)}
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        selectedModel={selectedImageModel}
        setSelectedModel={setSelectedImageModel}
        onConfirm={() => { }}
      /> */}

      <LoadingModal isOpen={isLoading} isComplete={false} contents={modalContents} />
    </div>
  );
};

export default ModelCustomization;