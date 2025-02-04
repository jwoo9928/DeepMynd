import { useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ChatLayout from './components/ChatLayout'
import { ChatController } from './\bcontrollers/ChatController'
import { LLMController } from './\bcontrollers/LLMController'
import { EVENT_TYPES, eventEmitter } from './\bcontrollers/events'
import { Message, ProgressItem } from './\bcontrollers/types'

function App() {
  const [status, setStatus] = useState<'loading' | 'ready' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tps, setTps] = useState<number | null>(null);
  const [numTokens, setNumTokens] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const chatController = useRef(ChatController.getInstance());
  const llmController = useRef(LLMController.getInstance());

  useEffect(() => {
    const handleModelStatus = (status: 'loading' | 'ready') => {
      setStatus(status);
    };

    const handleLoadingMessage = (message: string) => {
      setLoadingMessage(message);
    };

    const handleProgressUpdate = (data: any) => {
      switch (data.type) {
        case 'initiate':
          setProgressItems(prev => [...prev, data]);
          break;
        case 'progress':
          setProgressItems(prev =>
            prev.map(item =>
              item.file === data.file ? { ...item, ...data } : item
            )
          );
          break;
        case 'done':
          setProgressItems(prev =>
            prev.filter(item => item.file !== data.file)
          );
          break;
      }
    };

    const handleGenerationUpdate = (data: any) => {
      setTps(data.tps);
      setNumTokens(data.numTokens);
    };

    const handleError = (error: string) => {
      setError(error);
      setStatus(null);
    };

    eventEmitter.on(EVENT_TYPES.MODEL_STATUS, handleModelStatus);
    eventEmitter.on(EVENT_TYPES.LOADING_MESSAGE, handleLoadingMessage);
    eventEmitter.on(EVENT_TYPES.PROGRESS_UPDATE, handleProgressUpdate);
    eventEmitter.on(EVENT_TYPES.GENERATION_UPDATE, handleGenerationUpdate);
    eventEmitter.on(EVENT_TYPES.ERROR, handleError);

    return () => {
      eventEmitter.off(EVENT_TYPES.MODEL_STATUS, handleModelStatus);
      eventEmitter.off(EVENT_TYPES.LOADING_MESSAGE, handleLoadingMessage);
      eventEmitter.off(EVENT_TYPES.PROGRESS_UPDATE, handleProgressUpdate);
      eventEmitter.off(EVENT_TYPES.GENERATION_UPDATE, handleGenerationUpdate);
      eventEmitter.off(EVENT_TYPES.ERROR, handleError);
    };
  }, []);

  useEffect(() => {
    // Subscribe to chat controller updates
    const unsubscribe = chatController.current.subscribe(() => {
      setMessages(chatController.current.getMessages());
      setIsGenerating(chatController.current.isGenerating());
    });

    return () => unsubscribe();
  }, []);

  const handleLoadModel = async () => {
    await llmController.current.initialize();
  };

  const handleSendMessage = async (content: string) => {
    await chatController.current.sendMessage(content);
  };

  const handleInterrupt = () => {
    chatController.current.interrupt();
  };

  const handleReset = () => {
    chatController.current.reset();
    setTps(null);
    setNumTokens(null);
  };

  if (!llmController.current.isAvailable()) {
    return (
      <div className="fixed w-screen h-screen bg-black z-10 bg-opacity-[92%] text-white text-2xl font-semibold flex justify-center items-center text-center">
        WebGPU is not supported<br />by this browser :&#40;
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="w-full max-w-[500px] p-4">
          <h2 className="text-xl font-semibold mb-4 text-center">{loadingMessage}</h2>
          {progressItems.map((item, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{item.file}</span>
                <span>{Math.round((item.progress / item.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(item.progress / item.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === null) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="max-w-[500px] text-center p-4">
          <img
            src="logo.png"
            alt="Logo"
            className="w-4/5 mx-auto mb-6 drop-shadow-lg"
          />
          <h1 className="text-4xl font-bold mb-4">DeepSeek-R1 WebGPU</h1>
          <p className="mb-6">
            A next-generation reasoning model that runs locally in your browser with WebGPU acceleration.
          </p>
          {error && (
            <div className="text-red-500 mb-4">
              <p className="font-semibold">Error loading model:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          <button
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            onClick={handleLoadModel}
            disabled={!!error}
          >
            Load Model
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
     <ChatLayout/>
    </>
  )
}

export default App
