import { atomWithStorage } from "jotai/utils";

interface UserInfo {
    name: string;
}

export const userInfoAtom = atomWithStorage<UserInfo | null>('userInfo', null);