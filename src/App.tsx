import ChatLayout from './components/chat/ChatLayout'
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from 'react';
import { DBController } from './controllers/DBController';
import { AuthController } from './controllers/AuthController';
import { User } from '@supabase/supabase-js';
import { useSetAtom } from 'jotai';
import { userInfoAtom } from './stores/data.store';
import { EVENT_TYPES, eventEmitter } from './controllers/events';

function App() {
  const setUser = useSetAtom(userInfoAtom);

  useEffect(() => {
    DBController.getDatabase();

    const handleAuthChange = (newUser: User | null) => {
      setUser(newUser);
      console.log("newUser 2", newUser);
    };

    eventEmitter.on(EVENT_TYPES.SESSION_CHANGED, handleAuthChange);
    eventEmitter.on(EVENT_TYPES.SESSION_RESTORED, handleAuthChange);
    eventEmitter.on(EVENT_TYPES.SESSION_EXPIRED, handleAuthChange);

    AuthController.getInstance();


    // Clean up listener on unmount
    return () => {
      eventEmitter.off(EVENT_TYPES.SESSION_CHANGED, handleAuthChange);
      eventEmitter.off(EVENT_TYPES.SESSION_RESTORED, handleAuthChange);
      eventEmitter.off(EVENT_TYPES.SESSION_EXPIRED, handleAuthChange);
    };
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