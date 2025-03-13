import ChatLayout from './components/chat/ChatLayout'
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from './components/auth/Auth';
import { useEffect } from 'react';
import { DBController } from './controllers/DBController';
import { pipeline } from '@huggingface/transformers';

function App() {

  const testing = async () => {
    const poet = await pipeline('text2text-generation', 'OLAIR/GRPO-Open-R1-1.5B');
    const result = await poet('Write me a love poem about cheese.', {
      max_new_tokens: 200,
      temperature: 0.9,
      repetition_penalty: 2.0,
      no_repeat_ngram_size: 3,
    });
    console.log(result);
  }


  useEffect(() => {
    DBController.getDatabase();
    // DBController.getDatabase().delete();
    testing()
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