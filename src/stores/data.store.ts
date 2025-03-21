import { Persona } from "../controllers/types";
import { atom } from "jotai";
import { User } from "@supabase/supabase-js";

export const userInfoAtom = atom<User | null>(null);
export const personaForUpdateAtom = atom<Persona | null>(null);