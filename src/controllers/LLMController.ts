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

export class LLMController {
    private static instance: LLMController;
    private tokenizer: AutoTokenizer | null = null;
    private model: AutoModelForCausalLM | null = null;
    private streamer: TextStreamer | null = null;
    private stopping_criteria: InterruptableStoppingCriteria;
    private past_key_values_cache: any = null;
    private isWebGPUAvailable: boolean = false;
    private generationStatus: GenerationStatus | null = null;

    private constructor() {
        this.stopping_criteria = new InterruptableStoppingCriteria();
        this.resetGenerationStatus();
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
            //@ts-ignore
            const adapter = await navigator.gpu?.requestAdapter();
            this.isWebGPUAvailable = true;
            if (!adapter) {
                console.error("WebGPU is not supported (no adapter found)");
                throw new Error("WebGPU is not supported (no adapter found)");
            }
            console.log("WebGPU is supported");
            const device = await adapter.requestDevice();
            if (!device) {
                throw new Error("WebGPU device request failed");
            }

            this.isWebGPUAvailable = true;
            console.log("WebGPU is fully supported",device);
        } catch (e) {
            this.isWebGPUAvailable = false;
            eventEmitter.emit(EVENT_TYPES.ERROR, `${e}`);
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
                eventEmitter.emit(EVENT_TYPES.PROGRESS_UPDATE, progress);
            });

            this.tokenizer = tokenizer;
            this.model = model;

            this.streamer = new TextStreamer(tokenizer, {
                skip_prompt: true,
                skip_special_tokens: true,
                callback_function: this.outputCallback.bind(this),
                token_callback_function: this.tokenCallback.bind(this),
            });

            eventEmitter.emit(EVENT_TYPES.LOADING_MESSAGE, 'Compiling shaders and warming up model...');

            eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'ready');
            return true;
        } catch (error) {
            eventEmitter.emit(EVENT_TYPES.ERROR, error);
            return false;
        }
    }

    private tokenCallback(tokens: bigint[]) {
        let { numTokens, startTime } = this.generationStatus as GenerationStatus;

        if (numTokens && startTime && this.generationStatus) {
            let tokenizer = this.tokenizer as PreTrainedTokenizer;

            const [START_THINKING_TOKEN_ID, END_THINKING_TOKEN_ID] = tokenizer.encode(
                "<think></think>",
                { add_special_tokens: false },
            );

            const tokenNumbers = tokens.map(Number); // bigint[] → number[]
            if (++numTokens > 1) {
                this.generationStatus.tps = (numTokens / (performance.now() - startTime)) * 1000;
            }
            if (tokenNumbers[0] === END_THINKING_TOKEN_ID) {
                this.generationStatus.state = "answering";
            }
        }
    };

    public outputCallback = (output: string) => {
        const { state, numTokens, tps } = this.generationStatus as GenerationStatus;
        eventEmitter.emit(EVENT_TYPES.GENERATION_UPDATE, {
            output,
            state,
            tps,
            numTokens,
        });
    };

    public async generate(messages: Message[]) {
        this.generationStatus = {
            state: "thinking",
            numTokens: 0,
            tps: undefined,
            startTime: performance.now()
        }
        if (!this.isWebGPUAvailable && !this.tokenizer && !this.model) {
            eventEmitter.emit(EVENT_TYPES.ERROR, 'WebGPU not available');
            return;
        }
        let tokenizer = this.tokenizer as PreTrainedTokenizer;
        let model = this.model as AutoModelForCausalLM;
        const inputs = tokenizer.apply_chat_template(messages, {
            add_generation_prompt: true,
            return_dict: true,
        });

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

    public async initialize(progressCallback?: (progress: ProgressItem) => void) {
        if (!this.isWebGPUAvailable) {
            eventEmitter.emit(EVENT_TYPES.ERROR, 'WebGPU not available');
            return;
        }
        await this.initializeModel();
    }

    public isAvailable(): boolean {
        return this.isWebGPUAvailable;
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