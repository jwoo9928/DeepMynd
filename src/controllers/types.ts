export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  answerIndex?: number;
  timestamp?: number;
}

export interface ChatRoom {
  messages: Message[];
  isRunning: boolean;
  roomId: string;
  personaId?: string;
  systemMessage: string;
  lastMessageTimestamp?: number;
  isPin: boolean;
  boostThinking: boolean;
}

export interface ProgressItem {
  file: string;
  progress: number;
  total: number;
  loaded: number;
}

export interface GenerationStatus {
  tps: number | undefined;
  numTokens: number;
  state: 'thinking' | 'answering';
  startTime: number | undefined;
}

export interface GenerationUpdateData {
  output: string;
  state: 'answering' | 'complete' | 'error';
}

export interface Persona {
  name: string;
  description: string;
  system: string;
  id: string;
  image?: string;
}