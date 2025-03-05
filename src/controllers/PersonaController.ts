import { v4 as uuid } from 'uuid';
import { NewPersona, Persona } from './types';
import { EVENT_TYPES, eventEmitter } from './events';
import { DBController } from './DBController';

export class PersonaController {
    private personaList: Map<string, Persona>;
    private static instance: PersonaController | null = null;
    private readonly dbController: DBController;
    private default_p_id = '3024e662-edcd-40d2-940e-d0919ad5170b';
    private focused_p_id: string | undefined;

    constructor() {
        this.personaList = new Map();
        this.dbController = DBController.getDatabase();
        eventEmitter.on(EVENT_TYPES.IMPORTED_PERSONA, this.setPersonaList.bind(this));
        eventEmitter.on(EVENT_TYPES.CHANGE_PERSONA, this.setFocusedPersona.bind(this));

    }

    public static getInstance(): PersonaController {
        if (!PersonaController.instance) {
            PersonaController.instance = new PersonaController();
        }
        return PersonaController.instance;
    }

    createNewPersona(newPersona: NewPersona): string {
        let persona: Persona;
        if (newPersona.avatar !== null && newPersona.avatar !== undefined) {
            const byteString = atob(newPersona.avatar.split(",")[1]);
            const mimeType = newPersona.avatar.split(",")[0].split(":")[1].split(";")[0];
            const arrayBuffer = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                arrayBuffer[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([arrayBuffer], { type: mimeType });
            //@ts-ignore
            persona = {
                ...newPersona,
                id: uuid(),
                avatar: blob
            }
        } else {
            persona = {
                ...newPersona,
                id: uuid(),
                avatar: new Blob()
            }
        }
        this.personaList.set(persona.id, persona);
        this.dbController.addPersona(persona);
        return persona.id;
    }

    getDefaultPersona(): Persona | undefined {
        const persona = this.personaList.get(this.default_p_id);
        return persona;
    }

    getDefaulPersonaId(): string {
        return this.default_p_id;
    }

    setPersonaList(personaList: Map<string, Persona>): void {
        this.personaList = personaList;
    }

    getPersona(uuid: string): Persona | undefined {
        return this.personaList.get(uuid);
    }

    getFocusedPersona(): Persona | undefined {
        if (this.focused_p_id) {
            return this.personaList.get(this.focused_p_id);
        }
        throw new Error('No focused persona');
    }

    setFocusedPersona(persona: Persona): void {
        this.focused_p_id = persona.id;
    }

    getPersonaList(): Persona[] {
        return Array.from(this.personaList.values());
    }


}