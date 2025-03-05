import { prebuiltAppConfig } from '@mlc-ai/web-llm';
import { ModelFormat, ModelList } from '../components/models/types';
import { eventEmitter, EVENT_TYPES } from './events';
import { Message } from './types';
import { WORKER_EVENTS, WORKER_STATUS } from "./workers/event";
import { v4 as uuid } from 'uuid';
import ONNX_Worker from "./workers/main-worker?worker";
import GGUF_Worker from "./workers/wllama-worker?worker";
import Image_worker from "./workers/image-worker?worker";
import MLC_Worker from "./workers/mlc-worker?worker";

export class LLMController {
    private static instance: LLMController;
    // private generationStatus: GenerationStatus | null = null;
    private workers: Map<string, Worker> = new Map();
    private focusedWokerId: string | null = null;
    private workerStates: Map<string, 'idle' | 'busy'> = new Map();
    private focused_model_id: string | null = null;
    private model_list: ModelList | null = null;
    // private modelStatus: ModelStatus = {
    //     text: null,
    //     image: null
    // }

    private constructor() {
        eventEmitter.on(EVENT_TYPES.MODEL_INITIALIZING, this.initializeModel.bind(this));
        eventEmitter.on(EVENT_TYPES.MODELS_UPDATED, this.setModelList.bind(this));
    }

    public static getInstance(): LLMController {
        if (!LLMController.instance) {
            LLMController.instance = new LLMController();
        }
        return LLMController.instance;
    }

    private setModelList(modelList: ModelList) {
        this.model_list = modelList;
    }

    public getModelList() {
        return this.model_list;
    }

    private getWokerker(format: ModelFormat) {
        let model_format = format.toLowerCase();
        if (model_format == ModelFormat.GGUF) {
            return new GGUF_Worker()
        } else if (model_format == ModelFormat.MLC) {
            return new MLC_Worker()
        } else if (model_format == ModelFormat.ONNX) { // onnx
            return new ONNX_Worker()
        } else {
            return new Image_worker()
        }
    }

    public async initializeModel(id: string) {
        try {
            if (!this.model_list) {
                throw new Error('Model list is not initialized');
            }
            const model = Object.values(this.model_list).flat().find((model) => model.id === id);
            //@ts-ignore
            const { model_id, format, file } = model;
            const worker = this.getWokerker(format);
            const workerId = uuid();
            this.focusedWokerId = workerId;
            worker.onmessage = (e) => this.eventHandler(workerId, e);
            this.workers.set(workerId, worker);
            this.workerStates.set(workerId, 'idle');
            console.log("worker is initialized")
            worker.postMessage({ type: WORKER_EVENTS.LOAD, data: { modelId: model_id, modelfile: file } });
            this.focused_model_id = model_id;
        } catch (error) {
            console.log("error", error)
        }
    }

    private eventHandler(workerId: string, event: MessageEvent) {
        const { type, status, data } = event.data;
        if (type !== undefined) {
            switch (type) {
                case WORKER_STATUS.STATUS_LOADING:
                    console.log("loading")
                    break;
                case WORKER_STATUS.STATUS_READY: //모델 준비 완료
                    eventEmitter.emit(EVENT_TYPES.MODEL_READY);
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
                console.log("model initial data", event.data)
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
            console.log("generateText testing")
            console.log("이벤트 발생 시 타입:", EVENT_TYPES.GENERATION_STARTING);
            eventEmitter.emit(EVENT_TYPES.GENERATION_STARTING, { type: 'text' });
            const id = this.focusedWokerId;
            let worker = this.workers.get(id);
            this.workerStates.set(id, 'busy');
            worker?.postMessage({ type: WORKER_EVENTS.GENERATION, data: messages });
        }
    }

    public stopGeneration() {
        if (this.focusedWokerId) {
            const id = this.focusedWokerId;
            let worker = this.workers.get(id);
            worker?.postMessage({ type: WORKER_EVENTS.GENERATION_STOP });
        }
    }

    public getModelIsInitialized() {
        return this.focusedWokerId !== null;
    }

    public getFocusedModelId() {
        return this.focused_model_id;
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