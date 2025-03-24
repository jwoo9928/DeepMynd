export const WORKER_STATUS = {
    //model status
    MODEL_INITIATE: 'initiate',
    MODEL_DOWNLOAD: 'download',
    MODEL_PROGRESS: 'progress',
    MODEL_DONE: 'done',

    //worker status
    STATUS_LOADING: 'loading',
    STATUS_READY: 'ready',
    STATUS_ERROR: 'error',
    CHECK: 'check',
    LOAD: 'load',

    //generation status
    GENERATION_UPDATE: 'generation_update',
    GENERATION_START: 'generation_start',
    GENERATION_COMPLETE: 'generation_complete',
    IMAGE_GEN_COMPLETE: 'image_gen_complete',
    INTERRUPT: 'interrupt',
    RESET: 'reset',

    //translation status
    TRANSLATOR_LOADING: 'translator_loading',
    TRANSLATOR_READY: 'translator_ready',
    TRANSLATION_UPDATE: 'translation_update',
    TRANSLATOR_ERROR: 'translator_error',
    TRANSLATION_COMPLETE: 'translation_complete',
}

export const WORKER_EVENTS = {
    CHECK: 'check',
    LOAD: 'load',
    INTERRUPT: 'interrupt',
    RESET: 'reset',
    GENERATION: 'generation',
    GENERATION_STOP: 'generation_stop',
    TRANSLATION_ALL: 'translation_all',
    TRANSLATION_END: 'translation_end',

}