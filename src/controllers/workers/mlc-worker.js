import {
  TextStreamer,
  InterruptableStoppingCriteria,
} from "@huggingface/transformers";
import {
  MLCTextGenePipeline,
  TextGenerationPipeline,
} from "../../pipelines/TextGenerationPipeline";
import { WORKER_STATUS, WORKER_EVENTS } from "./event";

let messageDB = [];

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
  const { modelId, quant } = data;
  self.postMessage({ type: WORKER_STATUS.STATUS_LOADING });
  const [model] = await MLCTextGenePipeline.getInstance(modelId, quant, (x) => {
    self.postMessage({
      status: "progress",
      progress: x.progress,
    });
  });

  model.setAppConfig({
    useIndexedDBCache: true,
  });

  self.postMessage({ type: WORKER_STATUS.STATUS_READY });
}

/**
 * This class uses the Singleton pattern to enable lazy-loading of the pipeline
 */

async function generate(messages) {
  const [model] = await MLCTextGenePipeline.getInstance();
  messageDB.push(...messages);
  self.postMessage({ status: WORKER_STATUS.GENERATION_START });

  const callback_function = (output) => {
    self.postMessage({
      type: WORKER_STATUS.GENERATION_UPDATE,
      data: {
        output,
      },
    });
  };

  const chunks = await model.chat.completions.create({
    messages: messageDB,
    temperature: 1,
    stream: true, // <-- Enable streaming
    stream_options: { include_usage: true },
  });
  // let reply = "";
  for await (const chunk of chunks) {
    // reply += chunk.choices[0]?.delta.content || "";
    callback_function(chunk.choices[0]?.delta.content);
  }

  self.postMessage({ type: WORKER_STATUS.GENERATION_COMPLETE });
}

async function stop_generate() {
  const [pipe] = await MLCTextGenePipeline.getInstance();
  pipe.interruptGenerate();
}

self.addEventListener("message", async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case WORKER_EVENTS.CHECK:
      check();
      break;
    case WORKER_EVENTS.LOAD:
      load(data);
      break;
    case WORKER_EVENTS.GENERATION:
      generate(data);
      break;
    case WORKER_EVENTS.INTERRUPT:
      break;
    case WORKER_EVENTS.RESET:
      past_key_values_cache = null;
      break;
    case WORKER_EVENTS.GENERATION_STOP:
      stop_generate();
      break;
  }
});
