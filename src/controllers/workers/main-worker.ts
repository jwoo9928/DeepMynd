import {
    TextStreamer,
    InterruptableStoppingCriteria,
} from "@huggingface/transformers";
import { TextGenerationPipeline } from "../../pipelines/TextGenerationPipeline";
import { WORKER_STATUS } from "./event";

interface Message {
    role: string;
    content: string;
}

interface WorkerMessage {
    type: string;
    data?: any;
}

/**
 * Helper function to perform feature detection for WebGPU
 */
async function check(): Promise<void> {
    try {
        //@ts-ignore
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error("WebGPU is not supported (no adapter found)");
        }
    } catch (e) {
        self.postMessage({
            type: WORKER_STATUS.STATUS_ERROR,
            data: (e as Error).toString(),
        });
    }
}

async function load(): Promise<void> {

    await TextGenerationPipeline.getInstance((x) => {
        self.postMessage(x);
        console.log(x);
    });

    self.postMessage({ status: WORKER_STATUS.STATUS_LOADING, data: "Compiling shaders and warming up model..." });

    self.postMessage({ status: WORKER_STATUS.STATUS_READY });
}

/**
 * This class uses the Singleton pattern to enable lazy-loading of the pipeline
 */

const stopping_criteria = new InterruptableStoppingCriteria();
let past_key_values_cache: any = null;

async function generate(messages: Message[]): Promise<void> {
    const [tokenizer, model] = await TextGenerationPipeline.getInstance();

    const inputs = tokenizer.apply_chat_template(messages, {
        add_generation_prompt: true,
        return_dict: true,
    });

    const [, END_THINKING_TOKEN_ID] = tokenizer.encode("<think></think>", {
        add_special_tokens: false,
    });

    let state: "thinking" | "answering" = "thinking";
    let startTime: number | undefined;
    let numTokens = 0;
    let tps: number | undefined;

    const token_callback_function = (tokens: bigint[]): void => {
        startTime ??= performance.now();
        if (numTokens++ > 0) {
            tps = (numTokens / (performance.now() - startTime)) * 1000;
        }
        if (tokens[0] === BigInt(END_THINKING_TOKEN_ID)) {
            state = "answering";
        }
    };

    const callback_function = (output: string): void => {
        self.postMessage({
            status: "update",
            output,
            tps,
            numTokens,
            state,
        });
    };

    const streamer = new TextStreamer(tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function,
        token_callback_function,
    });

    self.postMessage({ status: WORKER_STATUS.GENERATION_START });

    // @ts-ignore
    const { past_key_values, sequences } = await model.generate({
        // @ts-ignore
        ...inputs,
        max_new_tokens: 2048,
        streamer,
        stopping_criteria,
        past_key_values_cache,
        return_dict_in_generate: true,
    });

    past_key_values_cache = past_key_values;

    const decoded = tokenizer.batch_decode(sequences, { skip_special_tokens: true });

    self.postMessage({
        status: WORKER_STATUS.GENERATION_COMPLETE,
        output: decoded,
        cache: past_key_values_cache,
    });
}

self.addEventListener("message", async (e: MessageEvent<WorkerMessage>) => {
    const { type, data } = e.data;

    switch (type) {
        case "check":
            check();
            break;
        case "load":
            load();
            break;
        case WORKER_STATUS.GENERATION_START:
            stopping_criteria.reset();
            generate(data);
            break;
        case "interrupt":
            stopping_criteria.interrupt();
            break;
        case "reset":
            past_key_values_cache = null;
            stopping_criteria.reset();
            break;
    }
});
