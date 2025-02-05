export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  answerIndex?: number;
}

export interface ChatRoom {
  messages: Message[];
  isRunning: boolean;
  roomId: string;
}

export interface ProgressItem {
  file: string;
  progress: number;
  total: number;
  loaded: number;
}
