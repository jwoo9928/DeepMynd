import { v4 as uuid } from 'uuid';
import { Persona } from './types';
import { EVENT_TYPES, eventEmitter } from './events';

export class PersonaController {
    private personaList: Map<string, Persona>;
    private default_p_id: string;
    private static instance: PersonaController | null = null;

    constructor() {
        this.personaList = new Map();
        const id = this.createNewPersona('Default', '')
        this.default_p_id = id

    }

    public static getInstance(): PersonaController {
        if (!PersonaController.instance) {
            PersonaController.instance = new PersonaController();
        }
        return PersonaController.instance;
    }

    createNewPersona(name: string, system: string, image?: string): string {
        // const systemMessage = { role: 'system', content: '' };
        const description = "This is a new model";
        const newPersona: Persona = {
            name: name,
            description: description,
            system: system,
            id: uuid(),
            image: image,
        }
        this.personaList.set(newPersona.id, newPersona);
        eventEmitter.emit(EVENT_TYPES.IMPORTED_PERSONA, newPersona.id);
        return newPersona.id;
    }

    getModelList(): Persona[] | undefined {
        return Array.from(this.personaList.values()) ?? undefined
    }

    getModel(uuid: string): Persona | undefined {
        return this.personaList.get(uuid);
    }

    getDefaultId(): string {
        return this.default_p_id;
    }


}