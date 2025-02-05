import {
    AutoTokenizer,
    AutoModelForCausalLM,
    TextStreamer,
    InterruptableStoppingCriteria,
    PreTrainedTokenizer,
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
            //@ts-ignore
            const adapter = await navigator.gpu?.requestAdapter();
            this.isWebGPUAvailable = true;
            if (!adapter) {
                throw new Error("WebGPU is not supported (no adapter found)");
            }
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
            console.log("tokenizer testing:", this.tokenizer)
            this.model = model;

            eventEmitter.emit(EVENT_TYPES.LOADING_MESSAGE, 'Compiling shaders and warming up model...');

            eventEmitter.emit(EVENT_TYPES.MODEL_STATUS, 'ready');
            return true;
        } catch (error) {
            eventEmitter.emit(EVENT_TYPES.ERROR, error);
            return false;
        }
    }

    public async generate(messages: Message[]) {
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

        const [START_THINKING_TOKEN_ID, END_THINKING_TOKEN_ID] = tokenizer.encode(
            "<think></think>",
            { add_special_tokens: false },
        );

        let state: "thinking" | "answering" = "thinking";
        let numTokens = 0;
        let tps: number | undefined;
        let startTime: number | undefined;

        const tokenCallback = (tokens: bigint[]) => {
            startTime ??= performance.now();

            const tokenNumbers = tokens.map(Number); // bigint[] → number[]
            if (++numTokens > 1) {
                tps = (numTokens / (performance.now() - startTime)) * 1000;
            }
            if (tokenNumbers[0] === END_THINKING_TOKEN_ID) {
                state = "answering";
            }
        };

        const outputCallback = (output: string) => {
            console.log("output", output)
            eventEmitter.emit(EVENT_TYPES.GENERATION_UPDATE, {
                output,
                state,
                tps,
                numTokens,
            });
        };

        const streamer = new TextStreamer(tokenizer, {
            skip_prompt: true,
            skip_special_tokens: true,
            callback_function: outputCallback,
            token_callback_function: tokenCallback,
        });
        eventEmitter.emit(EVENT_TYPES.GENERATION_START);
        const { past_key_values, sequences } = await model.generate({
            ...inputs,
            // TODO: Add back when fixed
            // past_key_values: past_key_values_cache,

            // Sampling
            do_sample: false,
            // repetition_penalty: 1.1,
            // top_k: 3,
            // temperature: 0.2,

            max_new_tokens: 2048,
            streamer,
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
}