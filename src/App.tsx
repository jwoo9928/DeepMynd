import { useEffect } from 'react'
import './App.css'
import ChatLayout from './components/chat/ChatLayout'
import Initialize from './components/Initialize'
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Auth from './components/auth/Auth';
import { EVENT_TYPES, eventEmitter } from './controllers/events';
import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { Wllama } from '@wllama/wllama';
import WasmFromCDN from '@wllama/wllama/esm/wasm-from-cdn.js';

function App() {
  const navigate = useNavigate();

  const initProgressCallback = (initProgress:any) => {
    console.log(initProgress);
  }

  const testing  = async () => {
  
    const selectedModel = "meta-llama/Llama-3.2-1B";

    const appConfig = {
      "model_list": [
        {
          "model": "https://huggingface.co/UnfilteredAI/NSFW-3B",
          "model_id": "UnfilteredAI/NSFW-3B",
          "model_lib": "some_model_lib_value",
        }
      ],
    };
    
    const engine = await CreateMLCEngine(
      selectedModel,
      { appConfig,
        initProgressCallback: initProgressCallback }, // engineConfig
    );
    
    const messages = [
      { role: "system", content: "You are a helpful AI assistant." },
      { role: "user", content: "Hello!" },
    ]
    
    const reply = await engine.chat.completions.create({
      messages,
    });
    console.log(reply.choices[0].message);
    console.log(reply.usage);
  }

  const initWllama = async () => {
    const CONFIG_PATHS = {
      'single-thread/wllama.wasm': '/path/to/wllama.wasm',
      'multi-thread/wllama.wasm': '/path/to/wllama.wasm',
    };

    const instance = new Wllama(WasmFromCDN, {
      parallelDownloads: 3,
      logger: console,
    });
    //https://huggingface.co/UnfilteredAI/NSFW-3B/resolve/main/nsfw-3b-iq4_xs-imat.gguf
    // Hugging Face에서 모델 로드 (분할된 경우 첫 번째 파일 지정)
    await instance.loadModelFromHF(
      'Ttimofeyka/MistralRP-Noromaid-NSFW-Mistral-7B-GGUF',
            'MistralRP-Noromaid-NSFW-7B-Q8_0.gguf',
      // {
      //   progressCallback:initProgressCallback,
      // }
    );
    const response = await instance.createCompletion('hi suck my dick!', {
      nPredict: 100,
      sampling: {
        temp: 0.7,
        top_k: 40,
        top_p: 0.9,
      },
      useCache: true,
      
    });
    console.log(response)

  };

  return (
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
  )
}

export default App