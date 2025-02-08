import { eventEmitter, EVENT_TYPES } from './events';
import {  Message } from './types';
import { WORKER_EVENTS, WORKER_STATUS } from "./workers/event";
import { v4 as uuid } from 'uuid';

export class LLMController {
    private static instance: LLMController;
    // private generationStatus: GenerationStatus | null = null;
    private workers: Map<string, Worker> = new Map();
    private text_gen_worker_id: string | undefined;
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
            eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'loading');
            const worker = new Worker(new URL("./workers/main-worker.js", import.meta.url), {
                type: "module",
            });
            const workerId = uuid();
            this.text_gen_worker_id = workerId;
            worker.onmessage = (e) => this.eventHandler(workerId, e);
            this.workers.set(workerId, worker);
            this.workerStates.set(workerId, 'idle');
            worker.postMessage({ type: WORKER_STATUS.CHECK });
            worker.postMessage({ type: WORKER_STATUS.LOAD });
            // eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'ready');
        } catch (error) {
            eventEmitter.emit(EVENT_TYPES.ERROR, `${error}`);
            return false;
        }
    }

    private eventHandler(workerId: string, event: MessageEvent) {
        const { type, status, data } = event.data;
        // console.log("event data", event.data)
        if (type !== undefined) {
            switch (type) {
                case WORKER_STATUS.STATUS_LOADING:
                    eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'loading');
                    break;
                case WORKER_STATUS.STATUS_READY:
                    eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'ready');
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
            eventEmitter.emit(EVENT_TYPES.GENERATION_START);
            const id = this.text_gen_worker_id;
            let worker = this.workers.get(id);
            this.workerStates.set(id, 'busy');
            worker?.postMessage({ type: WORKER_EVENTS.GENERATION, data: messages });
        }
    }
}