import { atomWithStorage } from "jotai/utils";
import { Persona } from "../controllers/types";
import { atom } from "jotai";

interface UserInfo {
    name: string;
}

export const userInfoAtom = atomWithStorage<UserInfo | null>('userInfo', null);
export const personaForUpdateAtom = atom<Persona | null>(null);