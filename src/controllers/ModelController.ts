import { v4 as uuid } from 'uuid';
import { Persona } from './types';
import { LLMController } from './LLMController';

export class PersonaController {
    private personaList: Persona[];
    private static instance: PersonaController | null = null;
    private readonly LLModelController: LLMController;

    constructor() {
        this.personaList = [];
        this.LLModelController = LLMController.getInstance();

    }

    public static getInstance(): PersonaController {
        if (!PersonaController.instance) {
            PersonaController.instance = new PersonaController();
        }
        return PersonaController.instance;
    }

    createNewModel(name: string, system: string): void {
        // const systemMessage = { role: 'system', content: '' };
        const description = "This is a new model";
        const newPersona: Persona = {
            name: name,
            description: description,
            system: system,
            id: uuid()
        }
        this.personaList.push(newPersona);
    }

    getModelList(): Persona[] {
        return this.personaList;
    }

    getModel(uuid: string): Persona | undefined {
        return this.personaList.find(persona => persona.id === uuid);
    }


}