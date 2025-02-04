import {
    AutoTokenizer,
    AutoModelForCausalLM,
    TextStreamer,
    InterruptableStoppingCriteria,
} from "@huggingface/transformers";
import { eventEmitter, EVENT_TYPES } from './events';
import { Message, ProgressItem } from './types';
import { TextGenerationPipeline } from "./TextGenerationPipeline";

export class LLMController {
    private static instance: LLMController;
    private tokenizer: AutoTokenizer | null = null;
    private model: AutoModelForCausalLM | null = null;
    private stopping_criteria: InterruptableStoppingCriteria;
    private past_key_values_cache: any = null;
    private isWebGPUAvailable: boolean = false;

    private constructor() {
        this.stopping_criteria = new InterruptableStoppingCriteria();
        this.checkWebGPU();
    }

    public static getInstance(): LLMController {
        if (!LLMController.instance) {
            LLMController.instance = new LLMController();
        }
        return LLMController.instance;
    }

    private async checkWebGPU() {
        try {
            const adapter = await navigator.gpu?.requestAdapter();
            console.log('adapter', adapter);
            this.isWebGPUAvailable = true;
            if (!adapter) {
                throw new Error("WebGPU is not supported (no adapter found)");
            }
        } catch (e) {
            this.isWebGPUAvailable = false;
            eventEmitter.emit(EVENT_TYPES.ERROR, e.toString());
        }
    }

    private async initializeModel() {
        if (!this.isWebGPUAvailable) {
          throw new Error("WebGPU is not supported");
        }
    
        try {
          eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'loading');
          eventEmitter.emit(EVENT_TYPES.LOADING_MESSAGE, 'Loading model...');
    
          // Model pipeline initialization with progress tracking
          const [tokenizer, model] = await TextGenerationPipeline.getInstance((progress) => {
            console.log("progress",progress)
            eventEmitter.emit(EVENT_TYPES.PROGRESS_UPDATE, progress);
          });
    
          this.tokenizer = tokenizer;
          this.model = model;
    
          eventEmitter.emit(EVENT_TYPES.LOADING_MESSAGE, 'Compiling shaders and warming up model...');
    
          eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'ready');
          return true;
        } catch (error) {
          eventEmitter.emit(EVENT_TYPES.ERROR, error);
          return false;
        }
      }

    // private handleWorkerMessage = async (e: MessageEvent) => {
    //     const { status, data } = e.data;

    //     switch (status) {
    //         case 'loading':
    //             eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'loading');
    //             eventEmitter.emit(EVENT_TYPES.LOADING_MESSAGE, data);
    //             break;

    //         case 'initiate':
    //             eventEmitter.emit(EVENT_TYPES.PROGRESS_UPDATE, {
    //                 type: 'initiate',
    //                 ...e.data
    //             });
    //             break;

    //         case 'progress':
    //             eventEmitter.emit(EVENT_TYPES.PROGRESS_UPDATE, {
    //                 type: 'progress',
    //                 ...e.data
    //             });
    //             break;

    //         case 'done':
    //             eventEmitter.emit(EVENT_TYPES.PROGRESS_UPDATE, {
    //                 type: 'done',
    //                 ...e.data
    //             });
    //             break;

    //         case 'ready':
    //             eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'ready');
    //             break;

    //         case 'start':
    //             eventEmitter.emit(EVENT_TYPES.GENERATION_START);
    //             break;

    //         case 'update':
    //             const { output, tps, numTokens, state } = e.data;
    //             eventEmitter.emit(EVENT_TYPES.GENERATION_UPDATE, {
    //                 output,
    //                 tps,
    //                 numTokens,
    //                 state
    //             });
    //             break;

    //         case 'complete':
    //             this.past_key_values_cache = e.data.past_key_values;
    //             eventEmitter.emit(EVENT_TYPES.GENERATION_COMPLETE, e.data);
    //             break;

    //         case 'error':
    //             eventEmitter.emit(EVENT_TYPES.ERROR, data);
    //             break;
    //     }
    // };

    // private handleWorkerError = (e: ErrorEvent) => {
    //     console.error('Worker error:', e);
    //     eventEmitter.emit(EVENT_TYPES.ERROR, e.message);
    // };

    public async generate(messages: Message[]) {
        if (!this.isWebGPUAvailable) {
            eventEmitter.emit(EVENT_TYPES.ERROR, 'WebGPU not available');
            return;
        }

        this.stopping_criteria.reset();
        // this.worker.postMessage({
        //     type: 'generate',
        //     data: {
        //         messages,
        //         past_key_values: this.past_key_values_cache,
        //         generation_config: {
        //             do_sample: false,
        //             max_new_tokens: 2048,
        //             return_dict_in_generate: true
        //         }
        //     }
        // });
    }

    public async initialize(progressCallback?: (progress: ProgressItem) => void) {
        if (!this.isWebGPUAvailable) {
            eventEmitter.emit(EVENT_TYPES.ERROR, 'WebGPU not available');
            return;
        }
        this.initializeModel();
    }

    public isAvailable(): boolean {
        return this.isWebGPUAvailable;
    }

    // Special tokens handling for thinking state
    private readonly THINKING_TOKENS = {
        START_TOKEN: 151648, // <think>
        END_TOKEN: 151649   // </think>
    };

    public getThinkingTokens() {
        return this.THINKING_TOKENS;
    }
}