import EventEmitter from 'eventemitter3';

export const EVENT_TYPES = {
  //model
  MODEL_STATUS: 'model_status',
  MODEL_INITIALIZING: 'model_initializing',
  MODEL_READY: 'model_ready',
  MODELS_UPDATED: 'models_updated',

  //llm
  PROGRESS_UPDATE: 'progress_update',
  GENERATION_STARTING: 'model generation_start',
  GENERATION_UPDATE: 'generation_update',
  GENERATION_COMPLETE: 'generation_complete',
  IMAGE_GEN_COMPLETE: 'image_gen_complete',

  //message
  MESSAGE_UPDATE: 'message update',

  ERROR: 'error',

  //persona
  CREATE_NEW_PERSONA: 'create_new_persona',
  IMPORTED_PERSONA: 'imported_persona',
  CHANGE_PERSONA: 'change_persona',

  //chat
  UPDATED_CHAT_ROOMS: 'updated_chat_rooms',
  ROOM_CHANGED: 'room_changed',

} as const;

export const eventEmitter = new EventEmitter();