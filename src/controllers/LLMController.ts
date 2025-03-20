import { ModelFormat, ModelList } from '../components/models/types';
import { eventEmitter, EVENT_TYPES } from './events';
import { Message } from './types';
import { WORKER_EVENTS, WORKER_STATUS } from "./workers/event";
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
    private focused_worker_id: string | null = null;
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

    public getModelInfo(id: string) {
        if (!this.model_list) {
            throw new Error('Model list is not initialized');
        }
        return Object.values(this.model_list).flat().find((model) => model.id === id);
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
            if (this.workers.get(id)) {
                this.focused_worker_id = id;
                setTimeout(() => {
                    eventEmitter.emit(EVENT_TYPES.MODEL_READY, Array.from(this.workers.keys()));
                }
                    , 1000);
                return
            }
            const model = Object.values(this.model_list).flat().find((model) => model.id === id);
            //@ts-ignore
            const { model_id, format, file } = model;
            const worker = this.getWokerker(format);
            const workerId = id;
            this.focusedWokerId = workerId;
            worker.onmessage = (e) => this.eventHandler(workerId, e);
            this.workers.set(workerId, worker);
            this.workerStates.set(workerId, 'idle');
            console.log("worker is initialized")
            worker.postMessage({ type: WORKER_EVENTS.LOAD, data: { modelId: model_id, modelfile: file } });
            this.focused_worker_id = id;
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
                    console.log("Array.from(this.workers.keys())", Array.from(this.workers.keys()))
                    eventEmitter.emit(EVENT_TYPES.MODEL_READY, Array.from(this.workers.keys()));
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
        eventEmitter.emit(EVENT_TYPES.MODEL_DELETED, Array.from(this.workers.keys()));
    }

    public async generateText(modelId: string, messages: Message[]) {
        console.log("generateText input id: ", modelId)
        if (this.workerStates.get(modelId) === 'busy') {
            //error처리
            return;
        }
        if (this.focusedWokerId !== modelId) {
            if (this.workers.get(modelId)) {
                this.focusedWokerId = modelId;
                this.focused_worker_id = modelId;
            } else {
                this.workers.size > 0 ?
                    eventEmitter.emit(EVENT_TYPES.MODEL_CHANGING) :
                    eventEmitter.emit(EVENT_TYPES.MODEL_INITIALIZING);
                await this.initializeModel(modelId)
            }
        }
        if (this.focusedWokerId) {
            console.log("generateText testing")
            const id = this.focusedWokerId;
            let worker = this.workers.get(id);
            this.workerStates.set(id, 'busy');
            worker?.postMessage({ type: WORKER_EVENTS.GENERATION, data: messages });
            console.log("이벤트 발생 시 타입:", EVENT_TYPES.GENERATION_STARTING);
            eventEmitter.emit(EVENT_TYPES.GENERATION_STARTING, { type: 'text' });
        }
    }

    public stopGeneration() {
        if (this.focusedWokerId) {
            const id = this.focusedWokerId;
            let worker = this.workers.get(id);
            this.workerStates.set(id, 'idle');
            worker?.postMessage({ type: WORKER_EVENTS.GENERATION_STOP });
        }
    }

    public getModelIsInitialized() {
        return this.focusedWokerId !== null;
    }

    public getFocusedModelId() {
        return this.focused_worker_id;
    }

    public async getMemoryUsage() {
        const memoryStats = {
            webGPU: {
                used: 0,
                total: 0,
                limits: {}
            },
            jsHeap: {
                used: 0,
                total: 0,
                limit: 0
            }
        };

        // WebGPU 관련 정보
        if ('gpu' in navigator) {
            try {
                //@ts-ignore
                const adapter = await navigator.gpu.requestAdapter();
                if (adapter) {
                    const device = await adapter.requestDevice();
                    let totalMemoryUsage = 0;

                    // 메모리 사용량 추적 (예시)
                    const buffer = device.createBuffer({
                        size: 1024, // 1KB 예시 버퍼
                        //@ts-ignore
                        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
                    });
                    totalMemoryUsage += buffer.size;

                    const texture = device.createTexture({
                        size: [256, 256, 1], // 256x256 텍스처
                        format: 'r8unorm', // 1바이트/픽셀
                        //@ts-ignore
                        usage: GPUTextureUsage.STORAGE | GPUTextureUsage.COPY_SRC
                    });
                    const bytesPerPixel = 1; // r8unorm 포맷의 경우
                    const textureSize = texture.width * texture.height * texture.depthOrArrayLayers * bytesPerPixel;
                    totalMemoryUsage += textureSize;

                    // WebGPU 메모리 사용량 및 총 용량
                    memoryStats.webGPU.used = totalMemoryUsage; // 추적된 메모리 사용량 (바이트)
                    memoryStats.webGPU.total = adapter.limits.maxBufferSize + adapter.limits.maxUniformBufferBindingSize + adapter.limits.maxTextureDimension2D; // WebGPU API에서 총 용량 제공 안 함

                    // WebGPU 제한 정보
                    memoryStats.webGPU.limits = {
                        maxTextureDimension2D: device.limits.maxTextureDimension2D,
                        maxBufferSize: device.limits.maxBufferSize,
                        maxUniformBufferBindingSize: device.limits.maxUniformBufferBindingSize
                    };
                } else {
                    memoryStats.webGPU.used = 0;
                    memoryStats.webGPU.total = 0;
                }
            } catch (err) {
                console.error('WebGPU 어댑터 요청 중 오류:', err);
                memoryStats.webGPU.used = 0;
                memoryStats.webGPU.total = 0;
            }
        } else {
            memoryStats.webGPU.used = 0;
            memoryStats.webGPU.total = 0;
        }

        // JS Heap 메모리 관련 정보 (Chrome 등 일부 브라우저에서 지원)
        //@ts-ignore
        if (performance && performance.memory) {
            //@ts-ignore
            memoryStats.jsHeap.used = performance.memory.usedJSHeapSize;
            //@ts-ignore
            memoryStats.jsHeap.total = navigator.deviceMemory//performance.memory.totalJSHeapSize;
            //@ts-ignore
            memoryStats.jsHeap.limit = navigator.deviceMemory//performance.memory.jsHeapSizeLimit;
        } else {
            memoryStats.jsHeap.used = 0;
            memoryStats.jsHeap.total = 0;
            memoryStats.jsHeap.limit = 0;
        }

        return memoryStats;
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