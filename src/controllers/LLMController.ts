import {
    AutoTokenizer,
    AutoModelForCausalLM,
    TextStreamer,
    InterruptableStoppingCriteria,
    PreTrainedTokenizer,
} from "@huggingface/transformers";
import { eventEmitter, EVENT_TYPES } from './events';
import { GenerationStatus, Message, ProgressItem } from './types';
import { TextGenerationPipeline } from "./TextGenerationPipeline";
import { WORKER_TYPE } from "./workers/event";
import { v4 as uuid } from 'uuid';

export class LLMController {
    private static instance: LLMController;
    private generationStatus: GenerationStatus | null = null;
    private workers: Map<string, Worker> = new Map();
    private workerStates: Map<string, 'idle' | 'busy'> = new Map();
    private taskQueue: Array<{
        task: any,
        resolve: (value: any) => void,
        reject: (reason?: any) => void
    }> = [];

    private constructor() {
        this.resetGenerationStatus();
    }

    public static getInstance(): LLMController {
        if (!LLMController.instance) {
            LLMController.instance = new LLMController();
        }
        return LLMController.instance;
    }

    private async initializeModel() {
        try {
            eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'loading');
            const worker = new Worker(new URL('./workers/main_worker.ts', import.meta.url), { type: 'module' });
            const workerId = uuid();
            worker.onmessage = (e) => this.eventHandler(workerId, e);
            worker.postMessage({ type: WORKER_TYPE.CHECK });
            worker.postMessage({ type: WORKER_TYPE.LOAD });
            this.workers.set(workerId, worker);
            this.workerStates.set(workerId, 'idle');
            eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'ready');
        } catch (error) {
            eventEmitter.emit(EVENT_TYPES.ERROR, error);
            return false;
        }
    }

    private eventHandler(workerId: string, event: MessageEvent) {
        const { type, data } = event.data;
        switch (type) {
            case WORKER_TYPE.STATUS_ERROR:
                // eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'loading');
                break;
            case WORKER_TYPE.STATUS_READY:
                eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'ready');
                break;
            case WORKER_TYPE.STATUS_ERROR:
                eventEmitter.emit(EVENT_TYPES.ERROR, data);
                break;
            case WORKER_TYPE.STATUS_UPDATE:
                eventEmitter.emit(EVENT_TYPES.GENERATION_UPDATE, data);
                break;
            case WORKER_TYPE.STATUS_COMPLETE:
                eventEmitter.emit(EVENT_TYPES.GENERATION_COMPLETE, data);
                break;
            case WORKER_TYPE.STATUS_ERROR:
                eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'loading');
                break;
            default:
                break;
        }
    }


    public async generate(messages: Message[]) {


        eventEmitter.emit(EVENT_TYPES.GENERATION_START);
        //@ts-ignore
        const { past_key_values, sequences } = await model.generate({
            //@ts-ignore
            ...inputs,
            // TODO: Add back when fixed
            // past_key_values: past_key_values_cache,

            // Sampling
            do_sample: false,
            // repetition_penalty: 1.1,
            top_k: 3,
            temperature: 0.8,
            max_new_tokens: 300,//2048,
            streamer: this.streamer,
            stopping_criteria: this.stopping_criteria,
            return_dict_in_generate: true,
        });


        this.stopping_criteria.reset();

        const past_key_values_cache = past_key_values;

        const decoded = tokenizer.batch_decode(sequences, {
            skip_special_tokens: true,

        });
        eventEmitter.emit(EVENT_TYPES.GENERATION_COMPLETE);
    }

    public resetGenerationStatus() {
        this.generationStatus = {
            state: "thinking",
            numTokens: 0,
            tps: undefined,
            startTime: undefined,
        };
    }
}