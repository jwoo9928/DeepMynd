import { eventEmitter, EVENT_TYPES } from './events';
import { ChatRoom, Message } from './types';
// import VoyVectorStorageController from '../db/voyDB';
import { LLMController } from './LLMController';
import { LLMWorkerManager } from './worker/WokerManager';
import { v4 as uuid } from 'uuid';

export class ChatController {
  private static instance: ChatController;
  private messages: Message[] = [];
  private Chats: Map<string, ChatRoom> = new Map();
  private llmController: LLMController;
  //   private vectorStore: VoyVectorStorageController;
  private isRunning: boolean = false;
  Chat: any;

  private constructor() {
    this.llmController = LLMController.getInstance();
    // this.vectorStore = new VoyVectorStorageController();
  }

  public static getInstance(): ChatController {
    if (!ChatController.instance) {
      ChatController.instance = new ChatController();
    }
    return ChatController.instance;
  }

  public createChatRoom() {
    const roomId = uuid();
    this.Chats.set(roomId, { messages: [], isRunning: false, roomId });
    return roomId;
  }

  public initializeEventListeners(roomId: string) {
    if (!this.Chats.has(roomId)) {
      throw new Error('Room not found');
    }
    eventEmitter.on(EVENT_TYPES.GENERATION_START, (() => {
      this.isRunning = true;
      this.updateMessages(this.getMessages().concat({ role: 'system', content: '' }));
    }).bind(this));

    eventEmitter.on(EVENT_TYPES.GENERATION_UPDATE, this.handleGenerationUpdate.bind(this));

    eventEmitter.on(EVENT_TYPES.GENERATION_COMPLETE, (() => {
      this.isRunning = false;
      this.Chats.get(roomId).isRunning = false;
      this.Chats.get(roomId).messages = [...this.getMessages()];
      this.updateMessages([]);
      // this.notifySubscribers();
    }).bind(this));
  }

  public removeListeners() {
    eventEmitter.off(EVENT_TYPES.GENERATION_START);
    eventEmitter.off(EVENT_TYPES.GENERATION_UPDATE);
    eventEmitter.off(EVENT_TYPES.GENERATION_COMPLETE);
  }

  private handleGenerationUpdate(data: { output: string; state: string }) {
    const { output, state } = data;
    let messages = this.getMessages();
    console.log("output2", output, messages);

    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    const updatedMessage = {
      ...lastMessage,
      content: lastMessage.content + output,
    };

    if (state === 'answering' && updatedMessage.answerIndex === undefined) {
      updatedMessage.answerIndex = lastMessage.content.length;
    }

    messages[messages.length - 1] = updatedMessage;
    eventEmitter.emit(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, messages);
  }

  public async sendMessage(roomId: string, content: string) {
    if (this.isRunning) return;
    const systemMessage: Message = { role: 'system', content: '' };
    const userMessage: Message = { role: 'user', content };
    let messages = this.Chats.get(roomId)?.messages || [];
    messages.push(userMessage);
    this.updateMessages(messages);
    console.log("this.messages", this.getMessages());

    // Vector store integration
    // await this.vectorStore.addEntry(content, 'user-message');
    this.llmController.generate([systemMessage].concat(messages));
    // this.notifySubscribers();
  }

  public getMessages(): Message[] {
    return this.messages;
  }

  public updateMessages(messages: Message[]) {
    this.messages = messages;
    // this.notifySubscribers();
  }

  public isGenerating(): boolean {
    return this.isRunning;
  }
}