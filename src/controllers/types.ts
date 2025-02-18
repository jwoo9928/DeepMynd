import { ModelFormat } from "../components/models/trypes";

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRoom {
  messages: Message[];
  roomId: string;
  personaId: string;
  systemMessage: string;
  lastMessageTimestamp?: number;
  isPin: boolean;
  boostThinking: boolean;
  image: string,
  name: string,
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
  cache: any;
}

export interface Persona {
  name: string;
  description: string;
  system: string;
  id: string;
  avatar?: string;
  producer: string;
  model_type: ModelFormat
  model_id: string;
}