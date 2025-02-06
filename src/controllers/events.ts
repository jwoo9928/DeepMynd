import EventEmitter from 'eventemitter3';

export const EVENT_TYPES = {
  MODEL_STATUS: 'model_status',
  LOADING_MESSAGE: 'loading_message',
  PROGRESS_UPDATE: 'progress_update',
  GENERATION_START: 'generation_start',
  GENERATION_UPDATE: 'generation_update',
  GENERATION_COMPLETE: 'generation_complete',
  CHAT_MESSAGE_RECEIVED: 'chat_message_received',
  ERROR: 'error',
  CREATE_NEW_PERSONA: 'create_new_persona',
  CREATE_NEW_CHAT: 'create_new_chat',
  IMPORTED_PERSONA: 'imported_persona',
} as const;

export const eventEmitter = new EventEmitter();