import React, { useEffect, useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { EVENT_TYPES, eventEmitter } from "../../controllers/events";
import { ModeValues } from "../types";
import { useSetAtom } from "jotai";
import { uiModeAtom } from "../../stores/ui.store";

// Loading Progress Modal - For initial model loading
const LoadingProgressModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const setMode = useSetAtom(uiModeAtom);

  const promoMessages = [
    "UniMynd will be your personal assistant! 💝",
    "All conversations are processed only on your device! Use it safely~ 🔒",
    "Did you know?\nUniMynd allows unlimited conversations! ✨",
    "We'll be your special AI friend! 💫"
  ];

  useEffect(() => {
    setProgress(0);

    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promoMessages.length);
    }, 3000);

    const handleModelInitializing = () => {
      setIsOpen(true);
    }

    const onClose = async () => {
      setIsOpen(false);
      setMode(ModeValues.Chat);
      setLoading(false);
    };

    const handleProgressUpdate = (data: any) => {
      if (data.status === 'progress') {
        const progress = data?.loaded ? data.loaded / data.total : data.progress;
        setProgress(progress * 100);
      }
    };

    eventEmitter.on(EVENT_TYPES.PROGRESS_UPDATE, handleProgressUpdate);
    eventEmitter.on(EVENT_TYPES.MODEL_INITIALIZING, handleModelInitializing);
    eventEmitter.on(EVENT_TYPES.MODEL_READY, onClose);

    return () => {
      clearInterval(interval);
      eventEmitter.off(EVENT_TYPES.PROGRESS_UPDATE, handleProgressUpdate);
      eventEmitter.off(EVENT_TYPES.MODEL_INITIALIZING, handleModelInitializing);
      eventEmitter.off(EVENT_TYPES.MODEL_READY, onClose);
    };
  }, [isOpen]);

  useEffect(() => {
    if (progress === 100) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [progress]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-8 m-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Bot className="h-10 w-10 text-blue-500" />
          </div>

          <h2 className="text-2xl font-semibold mb-2">Select Persona</h2>
          <p className="text-gray-500 mb-6">Loading your AI assistant...</p>

          {loading ? (
            <div className="w-full mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Loading Model</span>
                <span className="text-blue-500 font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center mb-6">
              <Loader2 className="animate-spin text-blue-500" size={36} />
            </div>
          )}

          <div className="w-full h-24 relative overflow-hidden bg-blue-50 rounded-lg p-4 mb-4">
            {promoMessages.map((message, index) => (
              <div
                key={index}
                className={`absolute w-full left-0 top-0 p-4 transition-all duration-500 ease-in-out ${index === currentPromoIndex
                  ? 'translate-x-0 opacity-100'
                  : index < currentPromoIndex
                    ? '-translate-x-full opacity-0'
                    : 'translate-x-full opacity-0'
                  }`}
              >
                <p className="text-blue-600 text-sm">{message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LoadingProgressModal);