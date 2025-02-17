import { eventEmitter, EVENT_TYPES } from './events';
import { Message } from './types';
import { WORKER_EVENTS, WORKER_STATUS } from "./workers/event";
import { v4 as uuid } from 'uuid';

export type model_type = 'onnx' | 'gguf' | 'mlc'

export class LLMController {
    private static instance: LLMController;
    // private generationStatus: GenerationStatus | null = null;
    private workers: Map<string, Worker> = new Map();
    private focusedWokerId: string | null = null;
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

    public async initializeModel(
        modelId: string,
        type: model_type,
        modelfile: string | undefined = undefined
    ) {
        try {
            let workerUrl = '';
            if (type == 'onnx') {
                workerUrl = "./workers/main-worker.js";
            } else if (type == 'gguf') {
                workerUrl = "./workers/gguf-worker.js";
            } else if (type == 'mlc') {
                workerUrl = "./workers/mlc-worker.js";
            }
            const worker = new Worker(new URL(workerUrl, import.meta.url), {
                type: "module",
            });
            const workerId = uuid();
            this.focusedWokerId = workerId;
            worker.onmessage = (e) => this.eventHandler(workerId, e);
            this.workers.set(workerId, worker);
            this.workerStates.set(workerId, 'idle');
            worker.postMessage({ type: WORKER_EVENTS.LOAD, data: { modelId, modelfile } });
        } catch (error) {
            console.log("error", error)
        }
    }

    private eventHandler(workerId: string, event: MessageEvent) {
        const { type, status, data } = event.data;
        if (type !== undefined) {
            switch (type) {
                case WORKER_STATUS.STATUS_LOADING: //모델 로딩 시작
                    break;
                case WORKER_STATUS.STATUS_READY: //모델 준비 완료
                    break;
                case WORKER_STATUS.STATUS_ERROR:
                    eventEmitter.emit(EVENT_TYPES.ERROR, data);
                    break;
                case WORKER_STATUS.GENERATION_UPDATE:
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

    public async deleteWorker(workerId: string) {
        const worker = this.workers.get(workerId);
        worker?.terminate();
        this.workers.delete(workerId);
    }

    public async generateText(messages: Message[]) {
        if (this.focusedWokerId) {
            eventEmitter.emit(EVENT_TYPES.GENERATION_START, { type: 'text' });
            const id = this.focusedWokerId;
            let worker = this.workers.get(id);
            this.workerStates.set(id, 'busy');
            worker?.postMessage({ type: WORKER_EVENTS.GENERATION, data: messages });
        }
    }

    // public async generateImage(text: string) {
    //     if (this.image_gen_worker_id) {
    //         eventEmitter.emit(EVENT_TYPES.GENERATION_START, { type: 'image' });
    //         const id = this.image_gen_worker_id;
    //         let worker = this.workers.get(id);
    //         this.workerStates.set(id, 'busy');
    //         worker?.postMessage({ type: WORKER_EVENTS.GENERATION, data: text });
    //     }
    // }
}