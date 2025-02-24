import { atom } from "recoil";
import { Mode, ModeValues } from '../components/types';

export const uiModeState = atom<Mode>({
    key: 'ui mode state',
    default: ModeValues.Chat
});