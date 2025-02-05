import { useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ChatLayout from './components/chat/ChatLayout'
import { ChatController } from './controllers/ChatController'
import { LLMController } from './controllers/LLMController'
import { EVENT_TYPES, eventEmitter } from './controllers/events'
import { Message, ProgressItem } from './controllers/types'
import Initialize from './components/Initialize'

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
      console.log("data", data)
      switch (data.status) {
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
    // const unsubscribe = chatController.current.subscribe(() => {
    //   setMessages(chatController.current.getMessages());
    //   setIsGenerating(chatController.current.isGenerating());
    // });

    // return () => unsubscribe();
  }, []);

  const handleLoadModel = async () => {
    await llmController.current.initialize();
  };

  return (
    <>
      <Initialize
        status={status}
        progressItems={progressItems}
        loadingMessage={loadingMessage}
        error={error}
        handleLoadModel={handleLoadModel}
      />
      <ChatLayout />
    </>
  )
}

export default App
