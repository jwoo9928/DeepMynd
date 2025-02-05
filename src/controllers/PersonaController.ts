import { v4 as uuid } from 'uuid';
import { Persona } from './types';
import { LLMController } from './LLMController';
import { ChatController } from './ChatController';

export class PersonaController {
    private personaList: Persona[];
    private static instance: PersonaController | null = null;
    private readonly LLModelController: LLMController;
    private readonly ChatController: ChatController;

    constructor() {
        this.personaList = [];
        this.LLModelController = LLMController.getInstance();
        this.ChatController = ChatController.getInstance();

    }

    public static getInstance(): PersonaController {
        if (!PersonaController.instance) {
            PersonaController.instance = new PersonaController();
        }
        return PersonaController.instance;
    }

    createNewPersona(name: string, system: string, image: string): void {
        // const systemMessage = { role: 'system', content: '' };
        const description = "This is a new model";
        const newPersona: Persona = {
            name: name,
            description: description,
            system: system,
            id: uuid(),
            image: image,
        }
        this.personaList.push(newPersona);
        this.ChatController.createChatRoom(newPersona.id, system);
    }

    getModelList(): Persona[] {
        return this.personaList;
    }

    getModel(uuid: string): Persona | undefined {
        return this.personaList.find(persona => persona.id === uuid);
    }


}