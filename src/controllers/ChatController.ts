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
  private currentGemrateRoomId: string | undefined;
  private focusedRoomId: string | undefined;

  private constructor() {
    this.chatRooms = new Map();
    this.llmController = LLMController.getInstance();
    this.personaController = PersonaController.getInstance();
    this.dbController = DBController.getDatabase();

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
          name: persona.name ?? 'UniMynd',
          activated: false
        });
      }
    }
    eventEmitter.emit(EVENT_TYPES.UPDATED_CHAT_ROOMS, firstRoomId);
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, { roomId: firstRoomId, messages: this.chatRooms.get(firstRoomId)?.messages ?? [] });

  }

  public async createChatRoom(persona: Persona): Promise<void> {
    const roomId = uuid();
    const messages: Message[] = []
    if (persona.system.trim().length > 0) {
      messages.push({
        role: 'system', content: persona.system
      });
      await this.dbController.addMessage({ roomId, sender: persona.id, message: messages[messages.length - 1], timestamp: Date.now() });
    }
    if (persona.first_message && persona.first_message.trim().length > 0) {
      messages.push({
        role: 'assistant', content: persona.first_message
      });
      await this.dbController.addMessage({ roomId, sender: persona.id, message: messages[messages.length - 1], timestamp: Date.now() });
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
      activated: false
    };

    this.chatRooms.set(roomId, newRoom);
    this.changeChatRoom(roomId);
    eventEmitter.emit(EVENT_TYPES.UPDATED_CHAT_ROOMS, newRoom.roomId);
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, { roomId, messages: [...messages] });
  }

  private getChatRoom(roomId: string): ChatRoom {
    const room = this.chatRooms.get(roomId);
    if (!room) {
      throw new Error(`Chat room with ID ${roomId} not found`);
    }
    return room;
  }

  public async sendMessage(content: string): Promise<void> {
    console.log("#4 sendMessage: ", content);
    this.currentGemrateRoomId = this.focusedRoomId;
    // const isImageCall = content.startsWith('/image');
    //@ts-ignore
    const room = this.getChatRoom(this.currentGemrateRoomId);
    console.log("#5 room: ", room);
    const userMessage: Message = { role: 'user', content: content };
    await this.dbController.addMessage({ roomId: room.roomId, sender: room.personaId, message: userMessage, timestamp: Date.now() });
    room.messages.push(userMessage)
    const sendMessage = room.activated ? [userMessage] : room.messages;
    !room.activated ? room.activated = true : null;
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, { roomId: this.currentGemrateRoomId, messages: sendMessage });
    // if (isImageCall) {
    //   // this.llmController.generateImage(content);
    // } else {
    //   this.llmController.generateText(room.modelId, sendMessage);
    // }
    this.llmController.generateText(room.modelId, sendMessage);
  }


  private handleGenerationStart({ type }: { type: string }): void {
    if (!this.currentGemrateRoomId) {
      return
    }
    console.log("#7 handleGenerationStart ");
    console.log("이벤트 발생 시 타입 2:", EVENT_TYPES.GENERATION_STARTING);
    const messages = this.getMessages();
    if (!messages) {
      return;
    }
    messages.push({ role: 'assistant', content: type == 'text' ? '' : '/image:' });
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, { roomId: this.currentGemrateRoomId, messages: [...messages] });
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
    messages[lastMessageIndex] = updatedMessage;

    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, { roomId: this.currentGemrateRoomId, messages: [...messages] });
  }

  private handleGenerationComplete(): void {
    const roomId = this.currentGemrateRoomId;
    if (roomId) {
      const room = this.getChatRoom(roomId);
      room.lastMessageTimestamp = Date.now();
      const messages = this.getMessages();
      this.dbController.addMessage({ roomId: room.roomId, sender: room.personaId, message: messages[messages.length - 1], timestamp: Date.now() });
      this.chatRooms.set(roomId, { ...room, messages: [...messages] });
      this.currentGemrateRoomId = undefined;
    }
  }

  public stopGeneration(): void {
    this.llmController.stopGeneration();
    this.currentGemrateRoomId = undefined;
  }

  public changeChatRoom(roomId: string): void {
    this.focusedRoomId = roomId;
    const room = this.getChatRoom(roomId);
    const persona = this.personaController.getPersona(room.personaId);
    if (persona) {
      eventEmitter.emit(EVENT_TYPES.CHANGE_PERSONA, persona);
    }
    eventEmitter.emit(EVENT_TYPES.ROOM_CHANGED, this.focusedRoomId)
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, { roomId, messages: [...room.messages] });
  }

  public async deleteChatRoom(roomId: string): Promise<void> {
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, { roomId, messages: [] });
    if (this.currentGemrateRoomId == roomId) {
      this.stopGeneration();
    }
    if (this.focusedRoomId === roomId) {
      this.focusedRoomId = undefined;
      const newCurrentRoom = this.getChatRooms()?.[0];
      if (newCurrentRoom) {
        this.changeChatRoom(newCurrentRoom.roomId);
      }
    }
    this.chatRooms.delete(roomId);
    await this.dbController.deleteMessagesByRoom(roomId);
    eventEmitter.emit(EVENT_TYPES.UPDATED_CHAT_ROOMS);
    eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, { roomId, messages: [] });
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
    return this.focusedRoomId;
  }

  public getGeneratedRoomId(): string | undefined {
    return this.currentGemrateRoomId;
  }

  public getMessages(): Message[] {
    if (!this.currentGemrateRoomId) {
      throw new Error('No chat room is focused');
    }
    return this.chatRooms.get(this.currentGemrateRoomId)?.messages ?? [];
  }

  public getFocusedRoomMessages(): Message[] {
    if (!this.focusedRoomId) {
      throw new Error('No chat room is focused');
    }
    return this.chatRooms.get(this.focusedRoomId)?.messages ?? [];
  }

  public getChatRooms(): ChatRoom[] {
    return Array.from(this.chatRooms.values());
  }
}