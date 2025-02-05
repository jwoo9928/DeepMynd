import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { PersonaController } from '../controllers/PersonaController';

interface ModelCustomizationProps {
  onBack: () => void;
}

const ModelCustomization = ({ onBack }:ModelCustomizationProps) => {
  const [modelName, setModelName] = useState<string>('');
  const [systemInstruction, setSystemInstruction] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const personaController = useRef(PersonaController.getInstance());

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

  const handleSubmit = () => {
    // Handle model creation logic here
    console.log({
      modelName,
      systemInstruction,
      profileImage
    });
    personaController.current.createNewPersona(modelName, systemInstruction, profileImage);
    onBack();

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
              <h1 className="text-2xl font-bold text-gray-900">Create Custom Model</h1>

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

              {/* Model Name */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Model Name</h2>
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
                  <h2 className="text-lg font-semibold mb-4">System Instructions</h2>
                  <textarea
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                    placeholder="Enter system instructions..."
                    rows={6}
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
                disabled={!modelName || !systemInstruction}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Model
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelCustomization;