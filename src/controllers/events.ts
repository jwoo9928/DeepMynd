import EventEmitter from 'eventemitter3';

export const EVENT_TYPES = {
  MODEL_STATUS: 'model_status',

  PROGRESS_UPDATE: 'progress_update',
  GENERATION_START: 'generation_start',
  GENERATION_UPDATE: 'generation_update',
  GENERATION_COMPLETE: 'generation_complete',
  IMAGE_GEN_COMPLETE: 'image_gen_complete',

  MESSAGE_UPDATE: 'message update',

  ERROR: 'error',
  CREATE_NEW_PERSONA: 'create_new_persona',
  CREATE_NEW_CHAT: 'create_new_chat',
  IMPORTED_PERSONA: 'imported_persona',
} as const;

export const eventEmitter = new EventEmitter();