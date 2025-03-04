import {
  TextStreamer,
  InterruptableStoppingCriteria,
} from "@huggingface/transformers";
import { MLCTextGenePipeline } from "../../pipelines/TextGenerationPipeline";
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

  await MLCTextGenePipeline.getInstance(modelId, (x) => {
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
  const [model] = await MLCTextGenePipeline.getInstance();

  let state = "thinking";
  let startTime;
  let numTokens = 0;
  let tps;

  const callback_function = (output) => {
    self.postMessage({
      type: WORKER_STATUS.GENERATION_UPDATE,
      data: {
        output,
        tps,
        numTokens,
        state,
      },
    });
  };

  self.postMessage({ status: WORKER_STATUS.GENERATION_START });

  const chunks = await engine.chat.completions.create({
    messages,
    temperature: 1,
    stream: true, // <-- Enable streaming
    stream_options: { include_usage: true },
  });

  // @ts-ignore
  let reply = "";
  for await (const chunk of chunks) {
    reply += chunk.choices[0]?.delta.content || "";
    callback_function(reply);
    if (chunk.usage) {
      //callback_function(chunk.usage); // only last chunk has usage
    }
  }

  self.postMessage({ type: WORKER_STATUS.GENERATION_COMPLETE });
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
  }
});
