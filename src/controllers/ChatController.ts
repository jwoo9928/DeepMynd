import { eventEmitter, EVENT_TYPES } from './events';
import { ChatRoom, Message, GenerationUpdateData, Persona } from './types';
import { LLMController } from './LLMController';
import { v4 as uuid } from 'uuid';
import { PersonaController } from './PersonaController';
import { DBController } from './DBController';

export class ChatController {
  private static instance: ChatController | null = null;
  private readonly llmController: LLMController;
  private readonly personaController: PersonaController;
  private readonly dbController: DBController;
  private chatRooms: Map<string, ChatRoom>;
  private currentMessages: Message[];
  private currentFocustRoomId: string | undefined;

  private constructor() {
    this.chatRooms = new Map();
    this.llmController = LLMController.getInstance();
    this.personaController = PersonaController.getInstance();
    this.dbController = DBController.getDatabase();
    this.currentMessages = [];

    eventEmitter.on(EVENT_TYPES.GENERATION_START, this.handleGenerationStart.bind(this));
    eventEmitter.on(EVENT_TYPES.GENERATION_UPDATE, this.handleGenerationUpdate.bind(this));
    eventEmitter.on(EVENT_TYPES.GENERATION_COMPLETE, this.handleGenerationComplete.bind(this));
    eventEmitter.on(EVENT_TYPES.IMAGE_GEN_COMPLETE, this.handleGenerationComplete.bind(this));

    eventEmitter.on(EVENT_TYPES.IMPORTED_PERSONA, this.createChatRoom.bind(this));

    this.initRoomsData();
  }

  public static getInstance(): ChatController {
    if (!ChatController.instance) {
      ChatController.instance = new ChatController();

    }

    return ChatController.instance;
  }

  private async initRoomsData(): Promise<void> {
    const roomsData = await this.dbController.getMessagesGroupedByRoom();
    for (const roomId in roomsData) {
      const roomMessages = roomsData[roomId];
      const messages = roomMessages.map((msg) => (msg.message));
      const personaId = roomMessages[1].sender;
      const systemMessage = this.personaController.getModel(personaId)?.system ?? '';
      this.chatRooms.set(roomId, { messages: messages, roomId, personaId, systemMessage, isPin: false, boostThinking: false });
    }
    // this.createDefaultChatRoom();
  }

  public createChatRoom(persona: Persona): void {
    const roomId = uuid();
    if (!p_id) {
      p_id = this.personaController.getDefaultId();
    }
    const model = this.personaController.getModel(p_id)
    const newRoom: ChatRoom = {
      messages: [],
      roomId,
      personaId: persona.id, //sender
      systemMessage: persona.system,
      isPin: false,
      boostThinking: false,
      image: model?.image ?? '/assets/deepmynd_500.jpg',
      name: model?.name ?? 'DeepMynd'
    };

    this.chatRooms.set(roomId, newRoom);
    eventEmitter.emit(EVENT_TYPES.CREATE_NEW_CHAT, newRoom);
    this.updateRoomId(roomId);
  }

  private getChatRoom(roomId: string): ChatRoom {
    const room = this.chatRooms.get(roomId);
    if (!room) {
      throw new Error(`Chat room with ID ${roomId} not found`);
    }
    return room;
  }

  private updateRoomId(roomId: string): void {
    if (this.currentFocustRoomId === roomId) {
      return;
    }
    this.currentFocustRoomId = roomId;
    const room = this.getChatRoom(roomId);
    this.currentMessages = room.messages;
    eventEmitter.emit(EVENT_TYPES.ROOM_CHANGED, roomId);
  }

  public createDefaultChatRoom(): boolean {
    try {
      const persona = this.personaController.getDefaultPersona();
      if (!persona) {
        throw new Error('Default persona not found');
      } else {
        this.createChatRoom(persona);
        return true
      }
    } catch (e) {
      console.error(e);
      return false
    }
  }

  public async sendMessage(content: string, boost: boolean = false): Promise<void> {
    if (!this.currentFocustRoomId) {
      this.createDefaultChatRoom();
    }
    const isImageCall = content.startsWith('/image');
    //@ts-ignore
    const room = this.getChatRoom(this.currentFocustRoomId);
    const systemMessage: Message = { role: 'system', content: '' };
    const userMessage: Message = { role: 'user', content: content };
    const messages = this.currentMessages.length === 0 ? [systemMessage, userMessage] : [userMessage];
    this.currentMessages.push(userMessage);
    this.dbController.addMessage({ roomId: room.roomId, sender: room.personaId, message: userMessage, timestamp: Date.now() });
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, [...this.currentMessages, messages]);
    if (isImageCall) {
      // this.llmController.generateImage(content);
    } else {
      this.llmController.generateText(messages);
    }
  }


  private handleGenerationStart({ type }: { type: string }): void {
    this.currentMessages.push({ role: 'assistant', content: type == 'text' ? '' : '/image:' });
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, this.currentMessages);
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
      // ...(state === 'answering' && lastMessage.answerIndex === undefined && {
      //   answerIndex: lastMessage.content.length
      // })
    };
    this.currentMessages[lastMessageIndex] = updatedMessage;

    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, this.currentMessages);
  }

  private handleGenerationComplete(data: {
    output?: string;
    blob?: Blob;
  }): void {
    const roomId = this.currentFocustRoomId;
    if (roomId) {
      const room = this.getChatRoom(roomId);
      room.lastMessageTimestamp = Date.now();
      if (data?.blob) {
        const url = URL.createObjectURL(data.blob);
        this.currentMessages[this.currentMessages.length - 1].content = `/image:${url}`;
        eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, this.currentMessages);
      }
      this.dbController.addMessage({ roomId: room.roomId, sender: room.personaId, message: this.currentMessages[this.currentMessages.length - 1], timestamp: Date.now() });
      this.chatRooms.set(roomId, { ...room, messages: [...this.currentMessages] });
    }
  }

  public changeChatRoom(roomId: string): void {
    if (this.currentFocustRoomId === roomId) {
      return;
    }
    const room = this.getChatRoom(roomId);
    this.currentMessages = room.messages;
    this.currentFocustRoomId = room.roomId;
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, this.currentMessages);
  }

  public deleteChatRoom(roomId: string): void {
    if (this.currentFocustRoomId === roomId) {
      this.currentFocustRoomId = undefined;
      this.currentMessages = [];
      const newCurrentRoom = this.getChatRooms()?.[0];
      if (newCurrentRoom) {
        this.changeChatRoom(newCurrentRoom.roomId);
      } else {
        this.createDefaultChatRoom();
      }
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

  // public isGenerating(roomId: string): boolean {
  //   return this.getChatRoom(roomId).isRunning;
  // }

  public getChatRooms(): ChatRoom[] {
    return Array.from(this.chatRooms.values());
  }
}