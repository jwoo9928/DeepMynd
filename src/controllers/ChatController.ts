import { eventEmitter, EVENT_TYPES } from './events';
import { Message } from './types';
// import VoyVectorStorageController from '../db/voyDB';
import { LLMController } from './LLMController';

export class ChatController {
  private static instance: ChatController;
  private messages: Message[] = [];
  private llmController: LLMController;
//   private vectorStore: VoyVectorStorageController;
  private isRunning: boolean = false;

  private constructor() {
    this.llmController = LLMController.getInstance();
    // this.vectorStore = new VoyVectorStorageController();
    this.initializeEventListeners();
  }

  public static getInstance(): ChatController {
    if (!ChatController.instance) {
      ChatController.instance = new ChatController();
    }
    return ChatController.instance;
  }

  private initializeEventListeners() {
    eventEmitter.on(EVENT_TYPES.GENERATION_START, () => {
      this.isRunning = true;
      this.messages = [...this.messages, { role: 'assistant', content: '' }];
      this.notifySubscribers();
    });

    eventEmitter.on(EVENT_TYPES.GENERATION_UPDATE, (data) => {
      const { output, state } = data;
      if (this.messages.length === 0) return;

      const lastMessage = this.messages[this.messages.length - 1];
      if (lastMessage.role !== 'assistant') return;

      const updatedMessage = {
        ...lastMessage,
        content: lastMessage.content + output,
      };

      if (state === 'answering' && updatedMessage.answerIndex === undefined) {
        updatedMessage.answerIndex = lastMessage.content.length;
      }

      this.messages[this.messages.length - 1] = updatedMessage;
      this.notifySubscribers();
    });

    eventEmitter.on(EVENT_TYPES.GENERATION_COMPLETE, () => {
      this.isRunning = false;
      this.notifySubscribers();
    });
  }

  public async sendMessage(content: string) {
    if (this.isRunning) return;

    const userMessage: Message = { role: 'user', content };
    this.messages = [...this.messages, userMessage];
    
    // Vector store integration
    // await this.vectorStore.addEntry(content, 'user-message');
    
    this.llmController.generate(this.messages);
    this.notifySubscribers();
  }

  public getMessages(): Message[] {
    return this.messages;
  }

  public isGenerating(): boolean {
    return this.isRunning;
  }

  public interrupt() {
    this.llmController.interrupt();
  }

  public reset() {
    this.messages = [];
    this.llmController.reset();
    this.notifySubscribers();
  }

  private subscribers: Array<() => void> = [];

  public subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }
}