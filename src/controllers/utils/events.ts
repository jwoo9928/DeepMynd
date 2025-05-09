import EventEmitter from 'eventemitter3';

export const EVENT_TYPES = {
  //model
  MODEL_STATUS: 'model_status',
  MODEL_INITIALIZING: 'model_initializing',
  MODEL_CHANGING: 'model_changing',
  MODEL_READY: 'model_ready',
  MODELS_UPDATED: 'models_updated',
  MODEL_DELETED: 'model_deleted',

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

  //auth
  SESSION_CHANGED: 'session_changed',
  SESSION_RESTORED: 'session_restored',
  TOKEN_REFRESHED: 'token_refreshed',
  SESSION_EXPIRED: 'logout',
  AUTH_READY: 'auth_ready',
  LOGIN_REDIRECT: 'login_redirect',

};

export type EventTypes = typeof EVENT_TYPES;

export const eventEmitter = new EventEmitter();