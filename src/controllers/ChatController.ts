import { eventEmitter, EVENT_TYPES } from './events';
import { ChatRoom, Message, GenerationUpdateData } from './types';
import { LLMController } from './LLMController';
import { v4 as uuid } from 'uuid';
import { PersonaController } from './PersonaController';

export class ChatController {
  private static instance: ChatController | null = null;
  private readonly chatRooms: Map<string, ChatRoom>;
  private readonly llmController: LLMController;
  private currentMessages: Message[];
  private currentFocustRoomId: string | undefined;
  private readonly personaController: PersonaController;

  private constructor() {
    this.chatRooms = new Map();
    this.llmController = LLMController.getInstance();
    this.personaController = PersonaController.getInstance();
    this.currentMessages = [];
  }

  public static getInstance(): ChatController {
    if (!ChatController.instance) {
      ChatController.instance = new ChatController();
    }
    return ChatController.instance;
  }

  public initializeEventListeners(): void {
    eventEmitter.on(EVENT_TYPES.GENERATION_START, this.handleGenerationStart.bind(this));
    eventEmitter.on(EVENT_TYPES.GENERATION_UPDATE, this.handleGenerationUpdate.bind(this));
    eventEmitter.on(EVENT_TYPES.GENERATION_COMPLETE, this.handleGenerationComplete.bind(this));
    eventEmitter.on(EVENT_TYPES.IMPORTED_PERSONA, this.createChatRoom.bind(this));
  }

  public removeEventListeners(): void {
    [
      EVENT_TYPES.GENERATION_START,
      EVENT_TYPES.GENERATION_UPDATE,
      EVENT_TYPES.GENERATION_COMPLETE,
      EVENT_TYPES.IMPORTED_PERSONA
    ].forEach(eventType => eventEmitter.off(eventType));
  }

  public createChatRoom(p_id?: string, systemMessage: string = ''): void {
    const roomId = uuid();
    const newRoom: ChatRoom = {
      messages: [],
      isRunning: false,
      roomId,
      personaId: p_id,
      systemMessage: systemMessage,
      isPin: false,
      boostThinking: false,
    };

    this.chatRooms.set(roomId, newRoom);
    eventEmitter.emit(EVENT_TYPES.CREATE_NEW_CHAT, roomId);
    this.updateRoomId(roomId);
  }

  private updateRoomId(roomId: string): void {
    if (this.currentFocustRoomId === roomId) {
      return;
    }
    this.currentFocustRoomId = roomId;
    const room = this.getChatRoom(roomId);
    console.log("rooms", this.getChatRooms())
    this.currentMessages = room.messages;
    eventEmitter.emit(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, this.currentMessages);
  }

  public createDefaultChatRoom(): boolean {
    try {
      this.createChatRoom(this.personaController.getDefaultId());
      return true
    } catch {
      return false
    }
  }

  public async sendMessage(content: string): Promise<void> {
    if (!this.currentFocustRoomId) {
      // throw new Error('No chat room selected');
      this.createDefaultChatRoom();
    }
    //@ts-ignore
    const room = this.getChatRoom(this.currentFocustRoomId);

    if (room.isRunning) {
      return;
    }
    const boostThinking = room.boostThinking ? 'Thinking shortly!' : '';
    const systemMessage: Message = { role: 'system', content: boostThinking + room.systemMessage };
    const userMessage: Message = { role: 'user', content };
    this.currentMessages.push(userMessage);
    // room.isRunning = true;
    eventEmitter.emit(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, this.currentMessages);
    console.log("1")
    this.llmController.generate([systemMessage].concat(this.currentMessages));
  }


  private handleGenerationStart(): void {
    this.currentMessages.push({ role: 'assistant', content: '' });
    eventEmitter.emit(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, this.currentMessages);
    console.log("2")
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

  private handleGenerationComplete(): void {
    const roomId = this.currentFocustRoomId;
    if (roomId) {
      const room = this.getChatRoom(roomId);
      room.lastMessageTimestamp = Date.now();
      room.isRunning = false;
      this.chatRooms.set(roomId, { ...room, messages: [...this.currentMessages] });
      //this.currentMessages = [];
      console.log("3")
    }

  }

  public changeChatRoom(roomId: string): void {
    if (this.currentFocustRoomId === roomId) {
      return;
    }
    const room = this.getChatRoom(roomId);
    this.currentMessages = room.messages;
    this.currentFocustRoomId = room.roomId;
    eventEmitter.emit(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, this.currentMessages);
  }

  public deleteChatRoom(roomId: string): void {
    if (this.currentFocustRoomId === roomId) {
      this.currentFocustRoomId = undefined;
      this.currentMessages = [];
      this.changeChatRoom(this.getChatRooms()[0].roomId);
    }
    this.chatRooms.delete(roomId);
  }

  public pinHandleChatRoom(roomId: string): void {
    const room = this.getChatRoom(roomId);
    if (room.isPin) {
      this.chatRooms.set(roomId, { ...room, isPin: false });
    } else {
      this.chatRooms.set(roomId, { ...room, isPin: true });
    }
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

  public getChatRooms(): ChatRoom[] {
    return Array.from(this.chatRooms.values());
  }

  public boostThinking(): boolean {
    if (this.currentFocustRoomId) {
      const room = this.getChatRoom(this.currentFocustRoomId);
      this.chatRooms.set(this.currentFocustRoomId, { ...room, boostThinking: !room.boostThinking });
      return room.boostThinking;
    }
    return false;
  }
}