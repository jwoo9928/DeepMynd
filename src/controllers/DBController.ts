import Dexie, { Table } from 'dexie';
import { Message, Persona } from './types';
import { EVENT_TYPES, eventEmitter } from './events';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { prebuiltAppConfig } from '@mlc-ai/web-llm';
import { v4 as uuid } from 'uuid';
import { Model, ModelFormat, ModelList } from '../components/models/types';
import axios from 'axios';

// 채팅 메시지 타입 정의
export interface ChatMessage {
    id?: number;
    roomId: string;
    sender: string; //persona id
    message: Message;
    timestamp: number;
}

interface ImageStore {
    p_id: string;
    image: Blob;
}

// Dexie 데이터베이스 설정
export class DBController extends Dexie {
    private messages!: Table<ChatMessage, number>;
    private personas!: Table<Persona, string>;
    private models!: Table<Model, string>;
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
        this.version(3).stores({
            messages: "++id, roomId, timestamp",
            personas: "id, name, system", // id를 기본 키로 설정
            models: "id, name, format, system",
        });

        this.initModelsList();
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

    // roomId별 메시지 삭제
    public async deleteMessagesByRoom(roomId: string): Promise<number> {
        return await this.messages.where('roomId').equals(roomId).delete();
    }

    /** 모델 관리 **/

    //모델 리스트 호출
    private async initModelsList(): Promise<ModelList> {
        const models = await this.getModelList();
        let modelList: ModelList = {
            gguf: [],
            mlc: [],
            onnx: [],
        };
        if (models.length > 0) {
            console.log('Models already loaded:', models);
            models.forEach((model) => {
                const format = model.format.toLowerCase().split('-')[0] as ModelFormat;
                modelList[format].push(model);
            });
            console.log('Model list:', modelList);
        } else {
            const { data, error } = await this.supabase.from('models').select('*');
            if (error) {
                console.error('Error fetching models:', error);
                return modelList;
            }
            const categorizedModels = data.reduce((acc, model) => {
                const format = model.format.toLowerCase();
                if (!acc[format]) {
                    acc[format] = [];
                }
                acc[format].push(model);
                this.models.put(model);
                return acc;
            }, { onnx: [], gguf: [], mlc: [] });
            categorizedModels.mlc = categorizedModels.mlc.concat(prebuiltAppConfig.model_list.map((model) => {
                const filtered = {
                    id: uuid(),
                    model_id: model.model_id,
                    name: model.model_id.split('/').pop() || '',
                    format: ModelFormat.MLC,
                    size: model.overrides?.context_window_size?.toString() || 'Unknown',
                    description: model.model_lib,
                    vram_required_MB: model.vram_required_MB,
                };
                this.models.put(filtered);
                return filtered
            }))
            modelList = categorizedModels;
        }
        eventEmitter.emit(EVENT_TYPES.MODELS_UPDATED, modelList);
        return modelList;
    }

    // get model
    public async getModelList(): Promise<Model[]> {
        return await this.models.toArray();
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
                    await Promise.all(
                        data.map(async (persona) => {
                            // avatar가 없는 경우 기본 이미지 경로로 설정
                            if (!persona.avatar) {
                                persona.avatar = './assets/default.png';
                            } else {
                                try {
                                    //avatar가 있으면, 해당 URL에서 이미지를 다운로드
                                    const response = await axios.get(persona.avatar, {
                                        responseType: 'blob',
                                    });
                                    const imageBlob = response.data;

                                    // uuid()로 고유 id 생성
                                    const imageId = uuid();

                                    // images 테이블에 저장 (예: Dexie 인스턴스 db)
                                    // await this.images.put({
                                    //     id: imageId,
                                    //     imageUrl: URL.createObjectURL(imageBlob), // 혹은 저장한 이미지 URL 사용
                                    // });

                                    // persona.avatar 값을 images 테이블의 id로 치환
                                    persona.avatar = imageBlob;
                                } catch (error) {
                                    console.error('Error downloading image for persona:', persona.id, error);
                                    // 실패 시 기본 이미지 사용
                                    persona.avatar = './assets/default.png';
                                }
                            }

                            // personaList에 저장 및 추가 로직 호출
                            personaList.set(persona.id, persona);
                            this.addPersona(persona);
                        })
                    );
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
