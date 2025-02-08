import { useEffect, useState } from 'react'
import './App.css'
import ChatLayout from './components/chat/ChatLayout'
import Initialize from './components/Initialize'
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

function App() {
  const [status, setStatus] = useState<'loading' | 'ready' | null>(null);
  const navigate = useNavigate();
  // ✅ 상태 변경에 따라 URL 이동
  useEffect(() => {
    if (status === "ready") {
      navigate("/chat");
    }
  }, [status]);

  return (
    <Routes>
      {/* status가 'ready'가 아니면 /init으로 이동 */}
      <Route path="/init" element={<Initialize status={status} setStatus={setStatus} />} />
      <Route path="/chat" element={<ChatLayout />} />
      {/* 기본적으로 /init으로 리다이렉트 */}
      <Route path="*" element={<Navigate to="/init" replace />} />
    </Routes>
  )
}

export default App
