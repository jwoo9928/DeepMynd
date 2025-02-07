import { eventEmitter, EVENT_TYPES } from './events';
import { GenerationStatus, Message } from './types';
import { WORKER_STATUS } from "./workers/event";
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
            console.log("created worker")
            const workerId = uuid();
            this.text_gen_worker_id = workerId;
            worker.onmessage = (e) => this.eventHandler(workerId, e);
            console.log("event handling")
            worker.postMessage({ type: WORKER_STATUS.CHECK });
            worker.postMessage({ type: WORKER_STATUS.LOAD });
            console.log("posted messagess")
            this.workers.set(workerId, worker);
            this.workerStates.set(workerId, 'idle');
            // eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'ready');
        } catch (error) {
            eventEmitter.emit(EVENT_TYPES.ERROR, `${error}`);
            return false;
        }
    }

    private eventHandler(workerId: string, event: MessageEvent) {
        const { type, data } = event.data;
        switch (type) {
            case WORKER_STATUS.MODEL_INITIALIZE
                || WORKER_STATUS.MODEL_PROGRESS
                || WORKER_STATUS.MODEL_DONE:
                console.log("init model update", type, data)
                eventEmitter.emit(EVENT_TYPES.PROGRESS_UPDATE, data);
                break;
            case WORKER_STATUS.STATUS_ERROR:
                // eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'loading');
                break;
            case WORKER_STATUS.STATUS_READY:
                eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'ready');
                break;
            case WORKER_STATUS.STATUS_ERROR:
                eventEmitter.emit(EVENT_TYPES.ERROR, data);
                break;
            case WORKER_STATUS.GENERATION_UPDATE:
                this.workerStates.set(workerId, 'busy');
                eventEmitter.emit(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, data);
                break;
            case WORKER_STATUS.GENERATION_COMPLETE:
                eventEmitter.emit(EVENT_TYPES.GENERATION_COMPLETE, data);
                break;
            case WORKER_STATUS.STATUS_ERROR:
                eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'loading');
                break;
            default:
                break;
        }
    }

    public async generateText(messages: Message[]) {
        if (this.text_gen_worker_id) {
            eventEmitter.emit(EVENT_TYPES.GENERATION_START);
            const id = this.text_gen_worker_id;
            let worker = this.workers.get(id);
            this.workerStates.set(id, 'busy');
            worker?.postMessage({ type: WORKER_STATUS.GENERATION_START, data: messages });
        }
    }
}