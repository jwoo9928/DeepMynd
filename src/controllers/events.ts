import EventEmitter from 'eventemitter3';

export const EVENT_TYPES = {
  MODEL_STATUS: 'model_status',
  LOADING_MESSAGE: 'loading_message',
  PROGRESS_UPDATE: 'progress_update',
  GENERATION_START: 'generation_start',
  GENERATION_UPDATE: 'generation_update',
  GENERATION_COMPLETE: 'generation_complete',
  ERROR: 'error'
} as const;

export const eventEmitter = new EventEmitter();