import { v4 as uuid } from 'uuid';
import { Persona } from './types';
import { EVENT_TYPES, eventEmitter } from './events';
import { DBController } from './DBController';
import { supabase } from '../lib/supabase';
import { cat } from '@huggingface/transformers';
import { ModelFormat } from '../components/models/trypes';

export class PersonaController {
    private personaList: Map<string, Persona>;
    private static instance: PersonaController | null = null;
    private readonly dbController: DBController;
    private default_p_id = '3024e662-edcd-40d2-940e-d0919ad5170b';

    constructor() {
        this.personaList = new Map();
        this.dbController = DBController.getDatabase();
        this.initPersonas();
        // const id = this.createNewPersona('Default', '', '/assets/deepmynd_500.jpg')

    }

    public async initPersonas(): Promise<void> {
        const personas = await this.dbController.getPersonas();
        console.log("personas", personas)
        if (personas.length > 0) {
            personas.forEach((persona) => {
                this.personaList.set(persona.id, persona);
            });
        } else {
            try {
                const { data, error } = await supabase
                    .from('persona')  // 'persona' 테이블에서 데이터 가져오기
                    .select('*');
                console.log("data", data)

                if (error) {
                    console.error('Error fetching personas from Supabase:', error.message);
                    return;
                }

                if (data && data.length > 0) {
                    data.forEach((persona: Persona) => {
                        this.personaList.set(persona.id, persona);
                        this.dbController.addPersona(persona);
                    });
                }
            } catch (error) {
                console.error('Error fetching personas from Supabase:', error);
            }
        }
    }

    public static getInstance(): PersonaController {
        if (!PersonaController.instance) {
            PersonaController.instance = new PersonaController();
        }
        return PersonaController.instance;
    }

    createNewPersona(name: string, system: string, model_id: string, model_type: ModelFormat, image?: string): string {
        const description = "This is a new model";
        const newPersona: Persona = {
            name: name,
            description: description,
            system: system,
            id: uuid(),
            image: image,
            producer: 'user',
            model_id,
            model_type
        }
        this.personaList.set(newPersona.id, newPersona);
        this.dbController.addPersona(newPersona);
        eventEmitter.emit(EVENT_TYPES.IMPORTED_PERSONA, newPersona.id);
        return newPersona.id;
    }

    getDefaultPersona(): Persona | undefined {
        const persona = this.personaList.get(this.default_p_id);
        return persona;
    }

    getDefaulPersonaId(): string {
        return this.default_p_id;
    }

    // getModelList(): Persona[] | undefined {
    //     return Array.from(this.personaList.values()) ?? undefined
    // }

    getPersona(uuid: string): Persona | undefined {
        return this.personaList.get(uuid);
    }

    getPersonaList(): Persona[] {
        return Array.from(this.personaList.values());
    }


}