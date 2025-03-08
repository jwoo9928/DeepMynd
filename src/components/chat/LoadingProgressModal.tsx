import React, { useEffect, useState } from "react";
import { Bot, Loader2, X } from "lucide-react";
import { EVENT_TYPES, eventEmitter } from "../../controllers/events";
import { ModeValues } from "../types";
import { useSetAtom } from "jotai";
import { uiModeAtom } from "../../stores/ui.store";


const LoadingProgressModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const setMode = useSetAtom(uiModeAtom);

  const promoMessages = [
    "DeepMynd will be your personal assistant! 💝",
    "All conversations are processed only on your device! Use it safely~ 🔒",
    "Did you know?\nDeepMynd allows unlimited conversations! ✨",
    "We'll be your special AI friend! 💫"
  ];

  useEffect(() => {
    // Reset progress when modal opens
    setProgress(0);

    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promoMessages.length);
    }, 3000);

    const handleModelInitializing = () => {
      setIsOpen(true);
    }

    const onClose = async () => {
      console.log("onClose")
      if (progress < 10) {
        for (let i = 0; i <= 100; i += 5) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setProgress(i);
        }
      }
      setMode(ModeValues.Chat);
      setIsOpen(false);
      setLoading(false)

    };

    const handleProgressUpdate = (data: any) => {
      if (data.status === 'progress') {
        const progress = data?.loaded ? data.loaded / data.total :  data.progress
        setProgress(progress * 100);
      }
    };

    eventEmitter.on(EVENT_TYPES.PROGRESS_UPDATE, handleProgressUpdate);
    eventEmitter.on(EVENT_TYPES.MODEL_INITIALIZING, handleModelInitializing)
    eventEmitter.on(EVENT_TYPES.MODEL_READY, onClose);

    return () => {
      clearInterval(interval);
      eventEmitter.off(EVENT_TYPES.PROGRESS_UPDATE, handleProgressUpdate);
      eventEmitter.off(EVENT_TYPES.MODEL_INITIALIZING, handleModelInitializing)
      eventEmitter.off(EVENT_TYPES.MODEL_READY, onClose);
    };
  }, [isOpen]);

  useEffect(() => {
    if (progress === 100) {
      setLoading(false)
    } else {
      setLoading(true)
    }
  }, [progress])

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-60 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 m-4 transition-all transform duration-300 scale-100">
        {/* Close button */}
        <button
          // onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-8 text-center">
          <div className="animate-bounce mb-6">
            <Bot className="h-16 w-16 mx-auto text-blue-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
            Preparing DeepMynd...
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Please wait while we load your AI friend
          </p>

          {loading ? <div className="bg-gray-50 dark:bg-gray-800/80 rounded-lg p-5 shadow-inner">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Loading Model</span>
              <span className="text-blue-500 font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div> :
            <div className="flex flex-col items-center">
              <div className="relative">
                <Loader2
                  className="animate-spin text-blue-500"
                  size={48}
                  strokeWidth={2.5}
                />
              </div>
            </div>
          }

        </div>

        <div className="relative h-24 overflow-hidden mt-8">
          {promoMessages.map((message, index) => (
            <div
              key={index}
              className={`absolute w-full transition-all duration-500 ease-in-out ${index === currentPromoIndex
                ? 'translate-x-0 opacity-100'
                : index < currentPromoIndex
                  ? '-translate-x-full opacity-0'
                  : 'translate-x-full opacity-0'
                }`}
            >
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
                <p className="text-blue-600 dark:text-blue-300 text-sm">{message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(LoadingProgressModal);