import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { ArrowLeft, Upload, X, Hash, Info } from 'lucide-react';
import { ModeValues } from '../types';
import { PersonaController } from '../../controllers/PersonaController';
import { FastAverageColor } from 'fast-average-color';
import { NewPersona } from '../../controllers/types';
import { useSetAtom } from 'jotai';
import { uiModeAtom } from '../../stores/ui.store';
import { Model, ModelFormat } from '../models/types';
import ModelSelectionModal from '../models/ModelSelectionModal';
import LoadingModal from '../models/LoadingModal';
import TourPersona from './atom/TourPersona'; // Import the new TourPersona component

// Tag input component
const TagInput = ({ tags, setTags, color }: { tags: string[], setTags: React.Dispatch<React.SetStateAction<string[]>>, color?: string }) => {
  // TagInput code remains unchanged
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && input.trim() !== '') {
      e.preventDefault();
      if (input.startsWith('#')) {
        addTag(input.substring(1));
      } else {
        addTag(input);
      }
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div 
      className="flex flex-wrap items-center gap-2 p-3 border border-gray-200 rounded-lg min-h-12 focus-within:ring-2 focus-within:ring-blue-500 cursor-text"
      onClick={handleContainerClick}
    >
      {tags.map((tag, index) => (
        <div 
          key={index} 
          className="flex items-center rounded-full px-3 py-1 text-sm"
          style={{ backgroundColor: `${color || '#7FAEFF'}33` }}
        >
          <span>#{tag}</span>
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="ml-1 text-gray-500 hover:text-gray-700"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className="flex-1">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="outline-none bg-transparent w-full min-w-24"
          placeholder={tags.length === 0 ? "Type and press Enter to add tags..." : ""}
          type="text"
        />
      </div>
    </div>
  );
};

// Section component for better organization
const Section = React.memo(({ 
  title, 
  children, 
  id 
}: { 
  title: string; 
  children: React.ReactNode; 
  id?: string;
}) => (
  <div className="bg-white rounded-lg shadow-sm" id={id}>
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  </div>
));

const ModelCustomization = () => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [systemInstruction, setSystemInstruction] = useState<string>('');
  const [firstMessage, setFirstMessage] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [profileColor, setProfileColor] = useState<string>('#7FAEFF');
  const [tags, setTags] = useState<string[]>([]);

  const [selectedTextModel, setSelectedTextModel] = useState<Model | null>(null);
  const [selectedImageModel, setSelectedImageModel] = useState<Model | null>(null);
  const [isTextModelModalOpen, setIsTextModelModalOpen] = useState(false);
  const [isImageModelModalOpen, setIsImageModelModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [runTour, setRunTour] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formEndRef = useRef<HTMLDivElement>(null);
  
  const setUIMode = useSetAtom(uiModeAtom);
  const personaController = useRef(PersonaController.getInstance());
  const fastAverageColor = useMemo(() => new FastAverageColor(), []);

  const modalContents = useMemo(() => ({
    title: 'Creating Persona...',
    subTitle: 'Please wait a moment',
    successTitle: 'Persona Created!',
    subSuccessTitle: 'Your new persona is ready to use'
  }), []);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [fastAverageColor]);

  const onBack = useCallback(() => {
    setUIMode(ModeValues.Import);
    setIsLoading(false);
  }, [setUIMode]);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
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
        tags: tags
      };
      await personaController.current.createNewPersona(persona);
      onBack();
    } else {
      setIsLoading(false);
      // You could add error notifications here
    }
  }, [name, selectedTextModel, systemInstruction, description, profileColor, firstMessage, profileImage, tags, onBack]);

  // Auto-scroll to bottom sections when needed
  const scrollToBottom = useCallback(() => {
    if (formEndRef.current) {
      formEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Start tour on first render
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenPersonaTour');
    if (!hasSeenTour) {
      // Slight delay to ensure all elements are rendered
      const timer = setTimeout(() => {
        setRunTour(true);
        localStorage.setItem('hasSeenPersonaTour', 'true');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Tour Component */}
      <TourPersona 
        isOpen={runTour} 
        onClose={() => setRunTour(false)} 
      />

      <div className="flex h-full">
        <div className="flex-1 flex flex-col h-full">
          {/* Header */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Chat</span>
            </button>
            
            <button
              onClick={() => setRunTour(true)}
              className="flex items-center space-x-1 text-blue-500 hover:text-blue-600"
            >
              <Info className="h-4 w-4" />
              <span>Tour</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">Create Your Own Persona</h1>

              {/* Profile Image Upload */}
              <Section title="Profile Image" id="profile-image">
                <div className="flex items-center space-x-6">
                  <div
                    className="relative w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer border-4 transition-all duration-200 hover:opacity-90"
                    style={{ borderColor: profileColor || '#7FAEFF' }}
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
              </Section>

              {/* Model Selection Cards */}
              <Section title="Select Models" id="model-selection">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Text Generation Model Card */}
                  <div
                    onClick={() => setIsTextModelModalOpen(true)}
                    className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors bg-white shadow-sm"
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
                    className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors bg-white shadow-sm"
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
              </Section>

              {/* Persona Details Section */}
              <Section title="Persona Details" id="persona-details">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter persona name..."
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      id="description"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter a short description..."
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </Section>

              {/* Special Abilities Tags */}
              <Section title="Special Abilities" id="special-abilities">
                <div className="space-y-2">
                  <div className="flex items-center mb-2">
                    <Hash className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-500">Add tags to highlight your persona's special abilities</span>
                  </div>
                  <TagInput tags={tags} setTags={setTags} color={profileColor} />
                </div>
              </Section>

              {/* System Instructions */}
              <Section title="Persona Instructions" id="instructions">
                <textarea
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  onClick={scrollToBottom}
                  placeholder="Enter detailed instructions about how your persona should behave, its personality, knowledge, and tone..."
                  rows={6}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Section>

              {/* First Message */}
              <Section title="First Message" id="first-message">
                <textarea
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  onClick={scrollToBottom}
                  placeholder="Enter the first message the persona will send when starting a new conversation..."
                  rows={4}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Section>

              {/* Reference point for scrolling */}
              <div ref={formEndRef}></div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-gray-200 p-4 shadow-md">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={handleSubmit}
                disabled={!name || !systemInstruction || !selectedTextModel}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Persona
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ModelSelectionModal
        isOpen={isTextModelModalOpen}
        onClose={() => setIsTextModelModalOpen(false)}
        onConfirm={setSelectedTextModel}
      />

      <ModelSelectionModal
        isOpen={isImageModelModalOpen}
        onClose={() => setIsImageModelModalOpen(false)}
        onConfirm={setSelectedImageModel}
      />

      <LoadingModal isOpen={isLoading} isComplete={false} contents={modalContents} />
    </div>
  );
};

export default React.memo(ModelCustomization);