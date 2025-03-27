import ChatLayout from './components/chat/ChatLayout'
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from 'react';
import { DBController } from './controllers/DBController';
import { User } from '@supabase/supabase-js';
import { useSetAtom } from 'jotai';
import { userInfoAtom } from './stores/data.store';
import { EVENT_TYPES, eventEmitter } from './controllers/utils/events';

function App() {
  const setUser = useSetAtom(userInfoAtom);

  useEffect(() => {
    DBController.getDatabase();

    const handleAuthChange = (newUser: User | null) => {
      setUser(newUser);
    };

    eventEmitter.on(EVENT_TYPES.SESSION_CHANGED, handleAuthChange);
    eventEmitter.on(EVENT_TYPES.SESSION_RESTORED, handleAuthChange);
    eventEmitter.on(EVENT_TYPES.SESSION_EXPIRED, handleAuthChange);


    // Clean up listener on unmount
    return () => {
      eventEmitter.off(EVENT_TYPES.SESSION_CHANGED, handleAuthChange);
      eventEmitter.off(EVENT_TYPES.SESSION_RESTORED, handleAuthChange);
      eventEmitter.off(EVENT_TYPES.SESSION_EXPIRED, handleAuthChange);
    };
  }, []);



  return (
    <Routes>
      <Route path="/" element={<ChatLayout />} />
      <Route path="/*" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App