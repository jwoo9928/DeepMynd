import { Persona } from "../controllers/types";
import { atom } from "jotai";
import { User } from "@supabase/supabase-js";
import { atomWithStorage } from "jotai/utils";
import { Language } from "../controllers/DBController";

export const userInfoAtom = atom<User | null>(null);
export const personaForUpdateAtom = atom<Persona | null>(null);
export const activateTranslateLanguageAtom = atomWithStorage<Language | null>('lanaguage', null);