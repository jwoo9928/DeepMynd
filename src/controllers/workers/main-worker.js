import {
  TextStreamer,
  InterruptableStoppingCriteria,
} from "@huggingface/transformers";
import { TextGenerationPipeline } from "../../pipelines/TextGenerationPipeline";
import { WORKER_STATUS, WORKER_EVENTS } from "./event";

/**
 * Helper function to perform feature detection for WebGPU
 */
async function check() {
  try {
    //@ts-ignore
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("WebGPU is not supported (no adapter found)");
    }
  } catch (e) {
    self.postMessage({
      type: WORKER_STATUS.STATUS_ERROR,
      data: e.toString(),
    });
  }
}

async function load(data) {
  const { modelId } = data;
  console.log("worker: data", data);
  self.postMessage({ type: WORKER_STATUS.STATUS_LOADING });

  await TextGenerationPipeline.getInstance(modelId, (x) => {
    self.postMessage(x);
  });

  self.postMessage({ type: WORKER_STATUS.STATUS_READY });
}

/**
 * This class uses the Singleton pattern to enable lazy-loading of the pipeline
 */

const stopping_criteria = new InterruptableStoppingCriteria();
let past_key_values_cache = null;

async function generate(messages) {
  const [tokenizer, model] = await TextGenerationPipeline.getInstance();

  const inputs = tokenizer.apply_chat_template(messages, {
    add_generation_prompt: true,
    return_dict: true,
  });

  const [, END_THINKING_TOKEN_ID] = tokenizer.encode("<think></think>", {
    add_special_tokens: false,
  });

  let state = "thinking";
  let startTime;
  let numTokens = 0;
  let tps;

  const token_callback_function = (tokens) => {
    startTime ??= performance.now();
    if (numTokens++ > 0) {
      tps = (numTokens / (performance.now() - startTime)) * 1000;
    }
    if (tokens[0] === BigInt(END_THINKING_TOKEN_ID)) {
      state = "answering";
    }
  };

  const callback_function = (output) => {
    self.postMessage({
      type: WORKER_STATUS.GENERATION_UPDATE,
      data: {
        output,
        tps,
        numTokens,
        state,
        format: 'onnx'
      },
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
  const { past_key_values } = await model.generate({
    // @ts-ignore
    ...inputs,
    max_new_tokens: 2048,
    streamer,
    stopping_criteria,
    past_key_values_cache,
    return_dict_in_generate: true,
  });

  past_key_values_cache = past_key_values;

  self.postMessage({ type: WORKER_STATUS.GENERATION_COMPLETE });
}

async function stop_generate() {
  const [, model] = await TextGenerationPipeline.getInstance();
  stopping_criteria.interrupt();
  model.interrupt();
}

self.addEventListener("message", async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case WORKER_EVENTS.CHECK:
      check();
      break;
    case WORKER_EVENTS.LOAD:
      console.log("load start", data);
      load(data);
      break;
    case WORKER_EVENTS.GENERATION:
      stopping_criteria.reset();
      generate(data);
      break;
    case WORKER_EVENTS.INTERRUPT:
      stopping_criteria.interrupt();
      break;
    case WORKER_EVENTS.RESET:
      past_key_values_cache = null;
      stopping_criteria.reset();
      break;
    case WORKER_EVENTS.GENERATION_STOP:
      stop_generate();
      break;
  }
});
