import { eventEmitter, EVENT_TYPES } from './events';
import {  Message } from './types';
import { WORKER_EVENTS, WORKER_STATUS } from "./workers/event";
import { v4 as uuid } from 'uuid';

export class LLMController {
    private static instance: LLMController;
    // private generationStatus: GenerationStatus | null = null;
    private workers: Map<string, Worker> = new Map();
    private text_gen_worker_id: string | undefined;
    private image_gen_worker_id: string | undefined;
    private workerStates: Map<string, 'idle' | 'busy'> = new Map();

    private constructor() {
        // this.initializeModel();

    }

    public static getInstance(): LLMController {
        if (!LLMController.instance) {
          LLMController.instance = new LLMController();
        }
        return LLMController.instance;
      }

    public async initializeModel() {
        try {
            console.log("testing")
            const worker = new Worker(new URL("./workers/main-worker.js", import.meta.url), {
                type: "module",
            });
            const workerId = uuid();
            this.text_gen_worker_id = workerId;
            worker.onmessage = (e) => this.eventHandler(workerId, e);
            this.workers.set(workerId, worker);
            this.workerStates.set(workerId, 'idle');

            
            const image_worker = new Worker(new URL("./workers/image-worker.js", import.meta.url), {
                type: "module",
            });
            const image_worker_id = uuid();
            this.image_gen_worker_id = image_worker_id;
            image_worker.onmessage = (e) => this.eventHandler(image_worker_id, e);
            console.log("test2", image_worker_id)
            this.workers.set(image_worker_id, image_worker);
            this.workerStates.set(image_worker_id, 'idle');

            worker.postMessage({ type: WORKER_EVENTS.CHECK });
            worker.postMessage({ type: WORKER_EVENTS.LOAD });
            image_worker.postMessage({ type: WORKER_EVENTS.CHECK });
            image_worker.postMessage({ type: WORKER_EVENTS.LOAD });
        } catch (error) {
            eventEmitter.emit(EVENT_TYPES.ERROR, `${error}`);
            return false;
        }
    }

    private eventHandler(workerId: string, event: MessageEvent) {
        const { type, status, data } = event.data;
        const modelType = workerId === this.text_gen_worker_id ? 'text' : 'image';
        console.log("event", event)
        if (type !== undefined) {
            switch (type) {
                case WORKER_STATUS.STATUS_LOADING:
                case WORKER_STATUS.STATUS_LOADING:
                    eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, {
                        type: modelType,
                        status: 'loading'
                    });
                    break;
                case WORKER_STATUS.STATUS_READY:
                    eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, {
                        type: modelType,
                        status: 'ready'
                    });
                    break;
                case WORKER_STATUS.STATUS_ERROR:
                    eventEmitter.emit(EVENT_TYPES.ERROR, data);
                    break;
                case WORKER_STATUS.GENERATION_UPDATE:
                    console.log("gen data", event)
                    eventEmitter.emit(EVENT_TYPES.GENERATION_UPDATE, data);
                    break;
                case WORKER_STATUS.GENERATION_COMPLETE:
                    this.workerStates.set(workerId, 'idle');
                    eventEmitter.emit(EVENT_TYPES.GENERATION_COMPLETE, data);
                    break;
                case WORKER_STATUS.IMAGE_GEN_COMPLETE:
                    this.workerStates.set(workerId, 'idle');
                    eventEmitter.emit(EVENT_TYPES.GENERATION_COMPLETE, data);
                    break;
                case WORKER_STATUS.STATUS_ERROR:
                    // eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'loading');
                    break;
            }
        } else {
            if (status === WORKER_STATUS.MODEL_INITIATE ||
                status === WORKER_STATUS.MODEL_PROGRESS ||
                status === WORKER_STATUS.MODEL_DONE ||
                status === WORKER_STATUS.MODEL_DOWNLOAD) {
                console.log("event data", event.data)
                eventEmitter.emit(EVENT_TYPES.PROGRESS_UPDATE, event.data);
                return;
            }
        }
    }

    public async generateText(messages: Message[]) {
        if (this.text_gen_worker_id) {
            eventEmitter.emit(EVENT_TYPES.GENERATION_START, {type: 'text'} );
            const id = this.text_gen_worker_id;
            let worker = this.workers.get(id);
            this.workerStates.set(id, 'busy');
            worker?.postMessage({ type: WORKER_EVENTS.GENERATION, data: messages });
        }
    }

    public async generateImage(text: string) {
        if (this.image_gen_worker_id) {
            eventEmitter.emit(EVENT_TYPES.GENERATION_START, {type:'image'});
            const id = this.image_gen_worker_id;
            let worker = this.workers.get(id);
            this.workerStates.set(id, 'busy');
            worker?.postMessage({ type: WORKER_EVENTS.GENERATION, data: text });
        }
    }
}