import { ModelFormat } from "../components/models/types";

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'ts' | 'origin';
  content: string;
}

export interface ChatRoom {
  messages: Message[];
  roomId: string;
  personaId: string;
  systemMessage: string;
  lastMessageTimestamp: number;
  isPin: boolean;
  boostThinking: boolean;
  image: Blob,
  name: string,
  modelId: string;
  activated: boolean;
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
  format?: ModelFormat;
}

export interface Persona {
  name: string;
  description: string;
  system: string;
  id: string;
  avatar: Blob;
  producer: string;
  model_type: ModelFormat
  model_id: string;
  first_message?: string;
  color: string;
  tags?: string[];
  q_type?: string;
}

export interface NewPersona {
  name: string;
  description: string;
  system: string;
  avatar?: string;
  producer: string;
  model_type: ModelFormat
  model_id: string;
  first_message?: string;
  color: string;
  id?: string;
  tags?: string[];
}