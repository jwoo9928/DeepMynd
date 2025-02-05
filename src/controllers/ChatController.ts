import { eventEmitter, EVENT_TYPES } from './events';
import { ChatRoom, Message, GenerationUpdateData } from './types';
import { LLMController } from './LLMController';
import { v4 as uuid } from 'uuid';

export class ChatController {
  private static instance: ChatController | null = null;
  private readonly chatRooms: Map<string, ChatRoom>;
  private readonly llmController: LLMController;
  private currentMessages: Message[];

  private constructor() {
    this.chatRooms = new Map();
    this.llmController = LLMController.getInstance();
    this.currentMessages = [];
  }

  public static getInstance(): ChatController {
    if (!ChatController.instance) {
      ChatController.instance = new ChatController();
    }
    return ChatController.instance;
  }

  public createChatRoom(): string {
    const roomId = uuid();
    const newRoom: ChatRoom = {
      messages: [],
      isRunning: false,
      roomId,
      systemMessage: ''
    };

    this.chatRooms.set(roomId, newRoom);
    return roomId;
  }

  public initializeEventListeners(roomId: string): void {
    const room = this.getChatRoom(roomId);

    eventEmitter.on(EVENT_TYPES.GENERATION_START, this.handleGenerationStart.bind(this));
    eventEmitter.on(EVENT_TYPES.GENERATION_UPDATE, this.handleGenerationUpdate.bind(this));
    eventEmitter.on(EVENT_TYPES.GENERATION_COMPLETE, () => this.handleGenerationComplete(roomId));
  }

  public removeEventListeners(): void {
    [
      EVENT_TYPES.GENERATION_START,
      EVENT_TYPES.GENERATION_UPDATE,
      EVENT_TYPES.GENERATION_COMPLETE
    ].forEach(eventType => eventEmitter.off(eventType));
  }

  public async sendMessage(roomId: string, content: string): Promise<void> {
    const room = this.getChatRoom(roomId);

    if (room.isRunning) {
      return;
    }
    if (this.currentMessages.length !== 0) {
      this.currentMessages = room.messages
    }

    const systemMessage: Message = { role: 'system', content: room.systemMessage };
    const userMessage: Message = { role: 'user', content };
    this.currentMessages.push(userMessage);

    eventEmitter.emit(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, this.currentMessages);
    this.llmController.generate([systemMessage].concat(this.currentMessages));
  }


  private handleGenerationStart(): void {
    this.currentMessages.push({ role: 'assistant', content: '' });
    eventEmitter.emit(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, this.currentMessages);
  }

  private handleGenerationUpdate(data: GenerationUpdateData): void {
    const { output, state } = data;
    const messages = this.getMessages();

    if (messages.length === 0) {
      return;
    }

    const lastMessageIndex = messages.length - 1;
    const lastMessage = messages[lastMessageIndex];

    const updatedMessage: Message = {
      ...lastMessage,
      content: lastMessage.content + output,
      ...(state === 'answering' && lastMessage.answerIndex === undefined && {
        answerIndex: lastMessage.content.length
      })
    };
    this.currentMessages[lastMessageIndex] = updatedMessage;

    eventEmitter.emit(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, this.currentMessages);
  }

  private handleGenerationComplete(roomId: string): void {
    const room = this.getChatRoom(roomId);
    room.isRunning = false;
    // room.messages = [...this.currentMessages];
    // this.currentMessages = [];
  }

  public getMessages(): Message[] {
    return this.currentMessages;
  }

  public isGenerating(roomId: string): boolean {
    return this.getChatRoom(roomId).isRunning;
  }

  private getChatRoom(roomId: string): ChatRoom {
    const room = this.chatRooms.get(roomId);
    if (!room) {
      throw new Error(`Chat room with ID ${roomId} not found`);
    }
    return room;
  }
}