import { eventEmitter, EVENT_TYPES } from './utils/events';
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

  public updateMessage() {
    if (this.focusedRoomId) {
      const room = this.getChatRoom(this.focusedRoomId);
      eventEmitter.emit(EVENT_TYPES.MESSAGE_UPDATE, room.messages);
    }
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
          activated: false,
          lastMessageTimestamp: roomMessages[roomMessages.length - 1].timestamp
        });
      }
    }
    this.focusedRoomId = firstRoomId;
    eventEmitter.emit(EVENT_TYPES.UPDATED_CHAT_ROOMS, firstRoomId);
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
      activated: false,
      lastMessageTimestamp: Date.now()
    };

    this.chatRooms.set(roomId, newRoom);
    this.changeChatRoom(roomId);
    eventEmitter.emit(EVENT_TYPES.UPDATED_CHAT_ROOMS, newRoom.roomId);
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
    //@ts-ignore
    const room = this.getChatRoom(this.currentGemrateRoomId);
    const isActivateTranslator = this.llmController.getIsActivateTranslator();

    //user message
    let userMessage: Message = { role: 'user', content: content };
    await this.dbController.addMessage({ roomId: room.roomId, sender: room.personaId, message: userMessage, timestamp: Date.now() });
    room.messages.push(userMessage)
    this.updateMessage();

    //translate message
    if (isActivateTranslator) { //번역기 활성화
      const translate = (await this.llmController.translate(content))?.data.output?.[0].translation_text;
      const llmMessage: Message = { role: 'ts', content: translate }
      this.dbController.addMessage({ roomId: room.roomId, sender: room.personaId, message: llmMessage, timestamp: Date.now() });
      room.messages.push(llmMessage);
      userMessage = { role: 'user', content: translate };
      this.updateMessage();
    }
    const sendMessage = room.activated ? [userMessage] : this.transformMessages(room.messages)
    !room.activated ? room.activated = true : false;
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
    this.updateMessage();
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
      content: format?.toLowerCase() == ModelFormat.GGUF ? output : (lastMessage.content + output),
    };
    messages[lastMessageIndex] = updatedMessage;

    this.updateMessage();
  }

  private handleGenerationComplete(data: { output: string }): void {
    const roomId = this.currentGemrateRoomId;
    if (roomId) {
      const room = this.getChatRoom(roomId);
      room.lastMessageTimestamp = Date.now();
      const messages = this.getMessages();
      this.dbController.addMessage({ roomId: room.roomId, sender: room.personaId, message: messages[messages.length - 1], timestamp: Date.now() });
      const isActivateTranslator = this.llmController.getIsActivateTranslator();
      if (isActivateTranslator) {
        room.messages.push({ role: 'origin', content: data.output });
        this.dbController.addMessage({ roomId: room.roomId, sender: room.personaId, message: { role: 'origin', content: data.output }, timestamp: Date.now() });
      }
      this.currentGemrateRoomId = undefined;
      this.updateMessage();
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
    this.updateMessage();
  }

  public async deleteChatRoom(roomId: string): Promise<void> {
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

  public getGeneratingRoomId(): string | undefined {
    return this.currentGemrateRoomId;
  }

  public isFocusingRoomGenerating(): boolean {
    return this.currentGemrateRoomId === this.focusedRoomId;
  }

  public getMessages(): Message[] {
    if (!this.currentGemrateRoomId) {
      // throw new Error('No chat room is focused');
      return []
    }
    return this.chatRooms.get(this.currentGemrateRoomId)?.messages ?? [];
  }

  public getFocusedRoomMessages(): Message[] {
    if (!this.focusedRoomId) {
      // throw new Error('No chat room is focused');
      return []
    }
    return this.chatRooms.get(this.focusedRoomId)?.messages ?? [];
  }

  public getChatRooms(): ChatRoom[] {
    return Array.from(this.chatRooms.values());
  }

  public transformMessages(messages: Message[]): Message[] {
    const transformed = [];
    let lastUser = null;
    let lastAssistant = null;

    for (const msg of messages) {
      if (msg.role == "system") {
        transformed.push(msg); // 변환 없이 추가
      }
      if (msg.role === 'user') {
        if (lastUser !== null) {
          transformed.push(msg); // 변환 없이 추가
        }
        lastUser = msg.content; // 원본 저장
      } else if (msg.role === 'assistant') {
        if (lastAssistant !== null) {
          transformed.push(msg); // 변환 없이 추가
        }
        lastAssistant = msg.content; // 원본 저장
      } else if (msg.role === 'ts' || msg.role === 'origin') {
        if (lastUser !== null) {
          if (lastAssistant != null) {
            transformed.push({ role: 'assistant', content: lastAssistant });
            lastAssistant = null;
          }
          transformed.push({ role: 'user', content: msg.content });
          lastUser = null; // 변환 완료 후 초기화
        } else if (lastAssistant !== null) {
          if (lastUser != null) {
            transformed.push({ role: 'user', content: lastUser });
            lastUser = null;
          }
          transformed.push({ role: 'assistant', content: msg.content });
          lastAssistant = null; // 변환 완료 후 초기화
        }
      }
    }
    if (lastAssistant !== null) {
      transformed.push({ role: 'assistant', content: lastAssistant });
    }
    if (lastUser !== null) {
      transformed.push({ role: 'user', content: lastUser });
    }
    console.log("transformed", transformed)
    console.log("messages", messages)

    return transformed as Message[];
  }
}