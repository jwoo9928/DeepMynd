import { eventEmitter, EVENT_TYPES } from './events';
import { ChatRoom, Message, GenerationUpdateData, Persona } from './types';
import { LLMController } from './LLMController';
import { v4 as uuid } from 'uuid';
import { PersonaController } from './PersonaController';
import { DBController } from './DBController';
import { ModelFormat } from '../components/models/types';

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

    eventEmitter.on(EVENT_TYPES.GENERATION_STARTING, this.handleGenerationStart.bind(this)) //() => console.log("fuckk youuu"))//this.handleGenerationStart.bind(this));
    eventEmitter.on(EVENT_TYPES.GENERATION_UPDATE, this.handleGenerationUpdate.bind(this));
    eventEmitter.on(EVENT_TYPES.GENERATION_COMPLETE, this.handleGenerationComplete.bind(this));
    eventEmitter.on(EVENT_TYPES.IMAGE_GEN_COMPLETE, this.handleGenerationComplete.bind(this));

    this.initRoomsData.bind(this)();
  }

  public static getInstance(): ChatController {
    if (!ChatController.instance) {
      ChatController.instance = new ChatController();

    }

    return ChatController.instance;
  }

  private async initRoomsData(): Promise<void> {
    const roomsData = await this.dbController.getMessagesGroupedByRoom();
    let firstRoomId = '';
    for (const roomId in roomsData) {
      const roomMessages = roomsData[roomId];
      if (!firstRoomId) {
        firstRoomId = roomId;
      }
      const messages = roomMessages.map((msg) => (msg.message));
      const personaId = roomMessages[1]?.sender;
      const persona = this.personaController.getPersona(personaId);
      if (persona) {
        const systemMessage = persona?.system ?? '';
        this.chatRooms.set(roomId, {
          messages: messages,
          roomId,
          personaId,
          systemMessage,
          isPin: false,
          boostThinking: false,
          modelId: persona.model_id,
          image: persona.avatar,
          name: persona.name ?? 'UniMynd'
        });
      }
    }
    this.currentMessages = this.chatRooms.get(firstRoomId)?.messages ?? [];
    eventEmitter.emit(EVENT_TYPES.UPDATED_CHAT_ROOMS, firstRoomId);
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, this.currentMessages);

  }

  public createChatRoom(persona: Persona): void {
    const roomId = uuid();
    const messages: Message[] = []
    if (persona.system.trim().length > 0) {
      messages.push({
        role: 'system', content: persona.system
      });
    }
    if (persona.first_message && persona.first_message.trim().length > 0) {
      messages.push({
        role: 'assistant', content: persona.first_message
      });
      this.dbController.addMessage({ roomId, sender: persona.id, message: messages[messages.length - 1], timestamp: Date.now() });
    }
    const newRoom: ChatRoom = {
      messages: messages,
      roomId,
      personaId: persona.id, //sender
      systemMessage: persona.system,
      modelId: persona.model_id,
      isPin: false,
      boostThinking: false,
      image: persona?.avatar,
      name: persona.name ?? 'UniMynd',
    };

    this.chatRooms.set(roomId, newRoom);
    this.changeChatRoom(roomId);
    this.currentMessages = messages;
    eventEmitter.emit(EVENT_TYPES.UPDATED_CHAT_ROOMS, newRoom.roomId);
  }

  private getChatRoom(roomId: string): ChatRoom {
    const room = this.chatRooms.get(roomId);
    if (!room) {
      throw new Error(`Chat room with ID ${roomId} not found`);
    }
    return room;
  }

  public async createDefaultChatRoom(): Promise<boolean> {
    try {
      const persona = this.personaController.getDefaultPersona();
      if (!this.llmController.getModelIsInitialized() && persona) {

        await this.llmController.initializeModel(
          persona.model_id,
        );
      }
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

  public async sendMessage(content: string): Promise<void> {
    console.log("#4 sendMessage: ", content, this.currentFocustRoomId);
    if (!this.currentFocustRoomId) {
      return;
    }
    const isImageCall = content.startsWith('/image');
    //@ts-ignore
    const room = this.getChatRoom(this.currentFocustRoomId);
    console.log("#5 room: ", room);
    const userMessage: Message = { role: 'user', content: content };
    this.currentMessages.push(userMessage);
    this.dbController.addMessage({ roomId: room.roomId, sender: room.personaId, message: userMessage, timestamp: Date.now() });
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, this.currentMessages);
    if (isImageCall) {
      // this.llmController.generateImage(content);
    } else {
      this.llmController.generateText(room.modelId, this.currentMessages);
    }
  }


  private handleGenerationStart({ type }: { type: string }): void {
    console.log("#7 handleGenerationStart: ", this.currentMessages);
    console.log("이벤트 발생 시 타입 2:", EVENT_TYPES.GENERATION_STARTING);
    this.currentMessages.push({ role: 'assistant', content: type == 'text' ? '' : '/image:' });
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, this.currentMessages);
  }

  private handleGenerationUpdate(data: GenerationUpdateData): void {
    const { output, state, format } = data;
    const messages = this.getMessages();
    console.log("state", state)

    if (messages.length === 0) {
      return;
    }

    const lastMessageIndex = messages.length - 1;
    const lastMessage = messages[lastMessageIndex];
    console.log("format", format)
    const updatedMessage: Message = {
      ...lastMessage,
      content: format?.toLowerCase() == ModelFormat.ONNX ? lastMessage.content + output : output,
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

  public stopGeneration(): void {
    this.llmController.stopGeneration();
  }

  public changeChatRoom(roomId: string): void {
    if (this.currentFocustRoomId === roomId) {
      return;
    }
    const room = this.getChatRoom(roomId);
    const persona = this.personaController.getPersona(room.personaId);
    if (persona) {
      eventEmitter.emit(EVENT_TYPES.CHANGE_PERSONA, persona);
    }
    console.log(room.messages)
    this.currentMessages = room.messages;
    this.currentFocustRoomId = room.roomId;
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, this.currentMessages);
  }

  public async deleteChatRoom(roomId: string): Promise<void> {
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, []);
    if (this.currentFocustRoomId === roomId) {
      this.currentFocustRoomId = undefined;
      this.currentMessages = [];
      const newCurrentRoom = this.getChatRooms()?.[0];
      if (newCurrentRoom) {
        this.changeChatRoom(newCurrentRoom.roomId);
      }
    }
    this.chatRooms.delete(roomId);
    await this.dbController.deleteMessagesByRoom(roomId);
    eventEmitter.emit(EVENT_TYPES.UPDATED_CHAT_ROOMS);
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, []);
  }

  public pinHandleChatRoom(roomId: string): void {
    const room = this.getChatRoom(roomId);
    if (room.isPin) {
      this.chatRooms.set(roomId, { ...room, isPin: false });
    } else {
      this.chatRooms.set(roomId, { ...room, isPin: true });
    }
  }

  public getFocusedRoomId(): string | undefined {
    return this.currentFocustRoomId;
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