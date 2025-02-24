import Dexie, { Table } from 'dexie';
import { Message, Persona } from './types';
import { EVENT_TYPES, eventEmitter } from './events';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { prebuiltAppConfig } from '@mlc-ai/web-llm';
import { v4 as uuid } from 'uuid';
import { ModelFormat, ModelList } from '../components/models/types';

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
    private messages!: Table<ChatMessage, number>;
    private personas!: Table<Persona, string>;
    private supabase: SupabaseClient;

    private static instance: DBController;

    private constructor() {
        super("ChatDatabase");
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase environment variables');
        }

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        this.version(2).stores({
            messages: "++id, roomId, timestamp",
            personas: "id, name, system" // id를 기본 키로 설정
        });

        this.getModelsList();
        this.initPersonas();
    }

    // 싱글턴 패턴으로 DB 인스턴스 관리
    public static getDatabase(): DBController {
        if (!DBController.instance) {
            DBController.instance = new DBController();
        }
        return DBController.instance;
    }

    public async handleSocialLogin(provider: 'google' | 'apple') {
        try {
            const { error } = await this.supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/init`
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error:', error);
            alert('Error signing in. Please try again.');
            return false;
        } finally {
            return true;
        }
    };

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

    /** 모델 관리 **/
    private async getModelsList(): Promise<ModelList> {
        const { data, error } = await this.supabase.from('models').select('*');
        if (error) {
            console.error('Error fetching models:', error);
            return {
                onnx: [],
                gguf: [],
                mlc: []
            };
        }
        const categorizedModels = data.reduce((acc, model) => {
            const format = model.format.toLowerCase();
            if (!acc[format]) {
                acc[format] = [];
            }
            acc[format].push(model);
            return acc;
        }, { onnx: [], gguf: [], mlc: [] });
        categorizedModels.mlc = categorizedModels.mlc.concat(prebuiltAppConfig.model_list.map((model) => ({
            id: uuid(),
            model_id: model.model_id,
            name: model.model_id.split('/').pop() || '',
            format: ModelFormat.MLC,
            size: model.overrides?.context_window_size?.toString() || 'Unknown',
            description: model.model_lib,
            vram_required_MB: model.vram_required_MB,
        })))
        eventEmitter.emit(EVENT_TYPES.MODELS_UPDATED, categorizedModels);
        return categorizedModels;
    }

    /** 📌 페르소나 관련 메서드 **/

    public async initPersonas(): Promise<Map<string, Persona> | undefined> {
        const personas = await this.getPersonas();
        let personaList = new Map<string, Persona>();
        if (personas.length > 0) {
            personas.forEach((persona) => {
                personaList.set(persona.id, persona);
            });
        } else {
            try {
                const { data, error } = await this.supabase
                    .from('persona')  // 'persona' 테이블에서 데이터 가져오기
                    .select('*');

                if (error) {
                    console.error('Error fetching personas from Supabase:', error.message);
                }

                if (data && data.length > 0) {
                    data.forEach((persona: Persona) => {
                        if (!persona.avatar) persona.avatar = './assets/default.png';
                        personaList.set(persona.id, persona);
                        this.addPersona(persona);
                    });
                }
            } catch (error) {
                console.error('Error fetching personas from Supabase:', error);
            }
        }
        eventEmitter.emit(EVENT_TYPES.IMPORTED_PERSONA, personaList);
        return personaList;
    }

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
