import ChatLayout from './components/chat/ChatLayout'
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from 'react';
import { DBController } from './controllers/DBController';
function App() {

  // const test = async () => {
  //   if ('measureUserAgentSpecificMemory' in performance) {
  //     const memoryStats = await performance.measureUserAgentSpecificMemory() as string;
  //     console.log('메모리 사용량:', memoryStats, 'GB');
  //   }
  // }

  useEffect(() => {
    DBController.getDatabase();
    console.log("CPU 코어 개수:", navigator.hardwareConcurrency);
    console.log("SharedArrayBuffer 지원:", typeof SharedArrayBuffer !== "undefined");
    // DBController.getDatabase().delete();
    // LLMController.getInstance();
    // ChatController.getInstance();
    // PersonaController.getInstance();

  }, []);



  return (
    <Routes>
      <Route path="/chat" element={<ChatLayout />} />
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/*" element={<Navigate to="/chat" replace />} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}

export default App