import { Mode, ModeValues } from '../components/types';
import { atomWithStorage } from 'jotai/utils';

export const uiModeAtom = atomWithStorage<Mode>('mode',ModeValues.Welcome);

export const isTermsAccepted = atomWithStorage('accepted', false);