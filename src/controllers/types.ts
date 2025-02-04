export interface Message {
    role: 'user' | 'assistant';
    content: string;
    answerIndex?: number;
  }
  
  export interface ProgressItem {
    file: string;
    progress: number;
    total: number;
  }
  