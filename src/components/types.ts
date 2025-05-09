export type Mode = 'Chat' | 'Create' | 'Import' | 'Edit' | 'Welcome' | 'Manage';

export const ModeValues = {
  Welcome: 'Welcome' as Mode,
  Chat: 'Chat' as Mode,
  Create: 'Create' as Mode,
  Import: 'Import' as Mode,
  Edit: 'Edit' as Mode,
  Manage: 'Manage' as Mode,
  Settings: 'Settings' as Mode,

};

export type ModelType = 'text' | 'image';
export type WorkerStatus = 'loading' | 'ready' | null;

export interface ModelStatus {
  text: WorkerStatus;
  image: WorkerStatus;
}

export interface UserSession {
  user: {
    id: string;
    email?: string;
    user_metadata: {
      avatar_url?: string;
      full_name?: string;
    };
  } | null;
}