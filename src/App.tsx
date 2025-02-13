import { useEffect, useState } from 'react'
import './App.css'
import ChatLayout from './components/chat/ChatLayout'
import Initialize from './components/Initialize'
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ModelStatus } from './components/types';

function App() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    text: null,
    image: null
  });
  const navigate = useNavigate();

  
  useEffect(() => {
    const isAllReady = Object.values(modelStatus).every(status => status === 'ready');
    if (isAllReady) {
      console.log("isAllReady: ",isAllReady)
      navigate("/chat");
    }
  }, [modelStatus]);

  return (
    <Routes>
      <Route 
        path="/init" 
        element={
          <Initialize 
            modelStatus={modelStatus} 
            setModelStatus={setModelStatus} 
          />
        } 
      />
      <Route path="/chat" element={<ChatLayout />} />
      <Route path="*" element={<Navigate to="/init" replace />} />
    </Routes>
  )
}

export default App