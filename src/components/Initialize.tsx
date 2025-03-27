import React, { useEffect, useState } from "react";
import { EVENT_TYPES, eventEmitter } from "../controllers/utils/events";
import { Bot, Sparkles } from "lucide-react";


const promoMessages = [
  "UniMynd will be your personal assistant! 💝",
  "All conversations are processed only on your device! Use it safely~ 🔒",
  "Did you know?\nUniMynd allows unlimited conversations! ✨",
  "We’ll be your special AI friend! 💫"
];

const Initialize = () => {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promoMessages.length);
    }, 3000);

    const handleProgressUpdate = (data: any) => {
      if (data.status === 'progress') {
        setProgress((data.loaded / data.total) * 100);
      }
    };

    const handleModelStatus = (data: any) => {
      if (data.status === 'loading') {
        setIsLoading(true);
      } else {
        setIsLoading(false);
      }
    }

    const handleError = (error: string) => {
      setError(error);
    };

    eventEmitter.on(EVENT_TYPES.MODEL_STATUS, handleModelStatus);
    eventEmitter.on(EVENT_TYPES.PROGRESS_UPDATE, handleProgressUpdate);
    eventEmitter.on(EVENT_TYPES.ERROR, handleError);

    return () => {
      clearInterval(interval);
      eventEmitter.off(EVENT_TYPES.MODEL_STATUS, handleModelStatus);
      eventEmitter.off(EVENT_TYPES.PROGRESS_UPDATE, handleProgressUpdate);
      eventEmitter.off(EVENT_TYPES.ERROR, handleError);
    };
  }, []);

  const handleLoadModel = async () => {
    //await llmController.current.initializeModel();
  };

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="max-w-[500px] text-center p-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
            <div className="mb-4">
              <span className="text-4xl">😢</span>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">
              앗! 문제가 발생했어요
            </h2>
            <p className="text-sm text-red-500 dark:text-red-300 mb-4">{error}</p>
            <button
              className="px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
              onClick={handleLoadModel}
            >
              다시 시도하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="w-full max-w-[500px] p-4">
          <div className="mb-8 text-center">
            <div className="animate-bounce mb-4">
              <span className="text-5xl"><Bot /></span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Preparing UniMynd...</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Please wait a moment!</p>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Loading Model</span>
                <span className="text-blue-500">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative h-24 overflow-hidden">
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
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
                  <p className="text-blue-600 dark:text-blue-300 text-sm">{message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-[500px] text-center p-4">
        <div className="mb-8">
          <img
            src="/assets/deepmynd.jpg"
            alt="DeepMynd Logo"
            className="w-4/5 mx-auto rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
          />
        </div>

        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
          DeepMynd Web
        </h1>

        <p className="mb-8 text-gray-600 dark:text-gray-300">
          Meet your new AI friend that works right in your browser! ✨
        </p>


        <button
          className="px-8 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transform hover:-translate-y-1 transition-all duration-200 shadow-lg hover:shadow-xl"
          onClick={handleLoadModel}
        >
          <span className="flex items-center justify-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>Meet Your AI Friend</span>
          </span>
        </button>
      </div>
    </div>
  );
}

export default React.memo(Initialize);