import Dexie, { Table } from 'dexie';
import { Message, Persona } from './types';

// 채팅 메시지 타입 정의
export interface ChatMessage {
    id?: number;
    roomId: string;
    sender: string; //persona id
    message: Message;
    timestamp: number;
}

// Dexie 데이터베이스 설정
export class DBController extends Dexie {
    messages!: Table<ChatMessage, number>;
    personas!: Table<Persona, string>;

    private static instance: DBController;

    private constructor() {
        super("ChatDatabase");
        this.version(2).stores({
            messages: "++id, roomId, timestamp",
            personas: "id, name, system" // id를 기본 키로 설정
        });
    }

    // 싱글턴 패턴으로 DB 인스턴스 관리
    public static getDatabase(): DBController {
        if (!DBController.instance) {
            DBController.instance = new DBController();
        }
        return DBController.instance;
    }

    /** 📌 채팅 메시지 관련 메서드 **/

    // 메시지 저장
    public async addMessage({ roomId, sender, message }: ChatMessage): Promise<number> {
        return await this.messages.add({
            roomId,
            sender,
            message,
            timestamp: Date.now(),
        });
    }

    // roomId별 메시지 그룹화
    public async getMessagesGroupedByRoom(): Promise<Record<string, ChatMessage[]>> {
        const messages = await this.messages.toArray();
        return messages.reduce((acc, msg) => {
            if (!acc[msg.roomId]) acc[msg.roomId] = [];
            acc[msg.roomId].push(msg);
            return acc;
        }, {} as Record<string, ChatMessage[]>);
    }

    /** 📌 페르소나 관련 메서드 **/

    // 페르소나 저장
    public async addPersona(persona: Persona): Promise<string> {
        return await this.personas.put(persona);
    }

    // 저장된 페르소나 목록 가져오기
    public async getPersonas(): Promise<Persona[]> {
        return await this.personas.toArray();
    }

    public async updatePersona(persona: Persona): Promise<number> {
        return await this.personas.update(persona.id, persona);
    }
}
