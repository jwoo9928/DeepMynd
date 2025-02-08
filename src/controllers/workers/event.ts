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
}

export const WORKER_EVENTS = {
    CHECK: 'check',
    LOAD: 'load',
    INTERRUPT: 'interrupt',
    RESET: 'reset',
    GENERATION: 'generation',

}