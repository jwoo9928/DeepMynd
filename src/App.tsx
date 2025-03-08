import ChatLayout from './components/chat/ChatLayout'
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from './components/auth/Auth';

function App() {

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