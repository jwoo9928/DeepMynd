import ChatLayout from './components/chat/ChatLayout'
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from './components/auth/Auth';
import { useEffect } from 'react';
import { DBController } from './controllers/DBController';
function App() {

  useEffect(() => {
    DBController.getDatabase();
    // DBController.getDatabase().delete();
    // LLMController.getInstance();
    // ChatController.getInstance();
    // PersonaController.getInstance();
  }, []);

  return (
    <Routes>
      <Route
        path="/auth"
        element={<Auth />}
      />
      <Route path="/chat" element={<ChatLayout />} />
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/*" element={<Navigate to="/chat" replace />} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}

export default App