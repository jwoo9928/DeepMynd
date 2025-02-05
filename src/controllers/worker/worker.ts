import {
    AutoTokenizer,
    AutoModelForCausalLM,
    TextStreamer,
    InterruptableStoppingCriteria,
    PreTrainedTokenizer,
} from "@huggingface/transformers";
import { TextGenerationPipeline } from "../TextGenerationPipeline";
import { Message, ProgressItem } from "../types";

let tokenizer: PreTrainedTokenizer | null = null;
let model: AutoModelForCausalLM | null = null;
let stoppingCriteria = new InterruptableStoppingCriteria();
let isWebGPUAvailable = false;
let isInitialized = false;

async function checkWebGPU() {
    try {
        //@ts-ignore
        const adapter = await navigator.gpu?.requestAdapter();
        isWebGPUAvailable = !!adapter;
        if (!adapter) throw new Error("WebGPU is not supported");
    } catch (e) {
        isWebGPUAvailable = false;
        postMessage({ type: "error", message: `${e}` });
    }
}

async function initializeModel({ tokenizer, model, stoppingCriteria }:
    { tokenizer: AutoTokenizer, model: AutoModelForCausalLM, stoppingCriteria: InterruptableStoppingCriteria }) {
    if (!isWebGPUAvailable) {
        postMessage({ type: "error", message: "WebGPU is not supported" });
        return;
    }
    postMessage({ type: "status", message: "loading" });
    try {
        tokenizer = tokenizer as PreTrainedTokenizer;
        model = model;
        stoppingCriteria = stoppingCriteria;
        isInitialized = true;
        postMessage({ type: "status", message: "ready" });
    } catch (error) {
        postMessage({ type: "error", message: error });
    }
}

onmessage = async (event) => {
    const { method, messages } = event.data;

    if (method === "initialize") {
        await checkWebGPU();
    } else if (method === "generate") {
        if (!isInitialized) {
            postMessage({ type: "error", message: "Model not initialized" });
            return;
        }
        if (tokenizer !== null || model !== null) {
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
                // self.postMessage({
                //     status: "update",
                //     output,
                //     tps,
                //     numTokens,
                //     state,
                // });
            };

            const streamer = new TextStreamer(tokenizer, {
                skip_prompt: true,
                skip_special_tokens: true,
                callback_function: outputCallback,
                token_callback_function: tokenCallback,
            });

            const { past_key_values, sequences } = await this.model.generate({
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


            stopping_criteria.reset();

            const past_key_values_cache = past_key_values;

            const decoded = tokenizer.batch_decode(sequences, {
                skip_special_tokens: true,

            });
        };
    }
}
