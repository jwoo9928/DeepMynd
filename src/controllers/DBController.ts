import Dexie, { Table } from 'dexie';
import { Message, Persona } from './types';
import { EVENT_TYPES, eventEmitter } from './utils/events';
import { SupabaseClient } from '@supabase/supabase-js';
import { prebuiltAppConfig } from '@mlc-ai/web-llm';
import { v4 as uuid } from 'uuid';
import { DeviceType, Model, ModelFormat, ModelList } from '../components/models/types';
import axios from 'axios';
import { AuthController } from './AuthController';

// 채팅 메시지 타입 정의
export interface ChatMessage {
    id?: number;
    roomId: string;
    sender: string; //persona id
    message: Message;
    timestamp: number;
}

export interface Language {
    id: number;
    language: string;
    FLORES_200: string;
}

// Dexie 데이터베이스 설정
export class DBController extends Dexie {
    private messages!: Table<ChatMessage, number>;
    private personas!: Table<Persona, string>;
    private models!: Table<Model, string>;
    private languages!: Table<Language, string>;
    private supabase: SupabaseClient;

    private static instance: DBController;

    private constructor() {
        super("ChatDatabase");

        this.supabase = AuthController.getInstance().getSupabase();
        this.version(4).stores({
            messages: "++id, roomId, timestamp",
            personas: "id, name, system", // id를 기본 키로 설정
            models: "id, name, format, system",
            languages: "id, language, FLORES_200",
        });

        this.initModelsList.bind(this)();
        this.initPersonas.bind(this)();
        this.initLanaguageList.bind(this)();
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
            models.forEach((model) => {
                const format = model.format.toLowerCase().split('-')[0] as ModelFormat;
                modelList[format].push(model);
            });
            console.log('Model list:', modelList);
        } else {
            console.log('Fetching models from Supabase...');
            const { data, error } = await this.supabase.from('models').select('*');
            if (error) {
                console.error('Error fetching models:', error);
                return modelList;
            }
            console.log("data")
            const categorizedModels = data.reduce((acc, model) => {
                const format = model.format.toLowerCase();
                if (!acc[format]) {
                    acc[format] = [];
                }
                acc[format].push(model);
                this.models.put(model);
                return acc;
            }, { onnx: [], gguf: [], mlc: [] });
            // categorizedModels.mlc = categorizedModels.mlc.concat(prebuiltAppConfig.model_list.map((model) => {
            //     const filtered = {
            //         id: uuid(),
            //         model_id: model.model_id,
            //         name: model.model_id.split('/').pop() || '',
            //         format: ModelFormat.MLC,
            //         size: model.overrides?.context_window_size || 0,
            //         description: model.model_lib,
            //         available: DeviceType.CPU,
            //         limit: model.vram_required_MB || 0,
            //     };
            //     this.models.put(filtered);
            //     return filtered
            // }))
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
                console.log("data", data)

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

                                    // persona.avatar 값을 images 테이블의 id로 치환
                                    persona.avatar = imageBlob;
                                } catch (error) {
                                    console.error('Error downloading image for persona:', persona.id, error);
                                    // 실패 시 기본 이미지 사용
                                    persona.avatar = './assets/default.png';
                                }
                                persona.tags = persona.tags?.split(',').map((tag: string) => tag.trim()) ?? [];
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

    // languages
    private async initLanaguageList() {
        const languages = await this.getLanguages();
        if (languages.length > 0) {

        } else {
            const { data, error } = await this.supabase.from('language').select('*');
            if (error) {
                console.error('Error fetching languages from Supabase:', error.message);
            }
            if (data && data.length > 0) {
                await Promise.all(
                    data.map(async (language) => {
                        this.languages.put({
                            id: language.index,
                            language: language.language,
                            FLORES_200: language['FLORES-200'],
                        });
                    })
                );
            }
        }

    }

    public getLanguages(): Promise<Language[]> {
        return this.languages.toArray();
    }

    public getSupabase(): SupabaseClient {
        return this.supabase;
    }
}
