import ChatLayout from './components/chat/ChatLayout'
import Initialize from './components/Initialize'
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from './components/auth/Auth';
import { RecoilRoot } from 'recoil';

function App() {

  return (
    <RecoilRoot>
      <Routes>
        <Route
          path="/auth"
          element={<Auth />}
        />
        <Route
          path="/init"
          element={<Initialize />} />
        <Route path="/chat" element={<ChatLayout />} />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </RecoilRoot>
  )
}

export default App