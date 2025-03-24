import { Mode, ModeValues } from '../components/types';
import { atomWithStorage } from 'jotai/utils';
import { atom } from 'jotai';

export const uiModeAtom = atomWithStorage<Mode>('mode', ModeValues.Welcome);

export const isTermsAccepted = atomWithStorage('accepted', false);

export const authModalOpen = atom<boolean>(false)

export const isActivateTranslator = atomWithStorage('activate_translator', true);