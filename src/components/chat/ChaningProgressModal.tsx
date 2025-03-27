import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { EVENT_TYPES, eventEmitter } from "../../controllers/utils/events";
import { ModeValues } from "../types";
import { useSetAtom } from "jotai";
import { uiModeAtom } from "../../stores/ui.store";

const ModelChangeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const setMode = useSetAtom(uiModeAtom);

  const totalSteps = 3;

  useEffect(() => {
    const handleModelChanging = () => {
      setIsOpen(true);
    };

    const handleModelInitializing = () => {
      currentStep <= 1 && setCurrentStep(2);
    };

    const onClose = async () => {
      setCurrentStep(3);
      setTimeout(() => {
        setCurrentStep(4);
        setIsOpen(false);
        setMode(ModeValues.Chat);
      }
        , 1000);
    }

    eventEmitter.on(EVENT_TYPES.MODEL_CHANGING, handleModelChanging);
    eventEmitter.on(EVENT_TYPES.MODEL_INITIALIZING, handleModelInitializing);
    eventEmitter.on(EVENT_TYPES.MODEL_READY, onClose);

    return () => {
      eventEmitter.off(EVENT_TYPES.MODEL_CHANGING, handleModelChanging);
      eventEmitter.off(EVENT_TYPES.MODEL_INITIALIZING, handleModelInitializing);
      eventEmitter.off(EVENT_TYPES.MODEL_READY, onClose);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-8 m-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <ArrowRight className="h-10 w-10 text-purple-500" />
          </div>

          <h2 className="text-2xl font-semibold mb-2">Switching Model</h2>
          <p className="text-gray-500 mb-6">Please wait while we change to your selected AI model</p>

          <div className="w-full flex justify-between mb-8">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${index + 1 < currentStep
                    ? 'bg-purple-500 text-white'
                    : index + 1 === currentStep
                      ? 'bg-purple-100 text-purple-500 border-2 border-purple-500'
                      : 'bg-gray-100 text-gray-400'
                    }`}
                >
                  {index + 1 < currentStep ? (
                    '✓'
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="text-xs mt-2 text-gray-500">
                  {index === 0 ? 'initializing' : index === 1 ? 'Switching' : 'Preparing'}
                </div>
              </div>
            ))}
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-6">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          <p className="text-sm text-gray-500">
            Your AI model will be ready in a moment
          </p>
        </div>
      </div>
    </div>
  );
};


export default React.memo(ModelChangeModal)
