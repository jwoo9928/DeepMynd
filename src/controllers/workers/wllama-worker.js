import {
  TextStreamer,
  InterruptableStoppingCriteria,
} from "@huggingface/transformers";
import { WLLAMATextGenPipeline } from "../../pipelines/TextGenerationPipeline";
import { WORKER_STATUS, WORKER_EVENTS } from "./event";
import { ModelFormat } from "../../components/models/types";

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
  const { modelId, modelfile } = data;
  console.log("wllama");
  self.postMessage({ type: WORKER_STATUS.STATUS_LOADING });

  await WLLAMATextGenPipeline.getInstance(modelId, modelfile, (x) => {
    self.postMessage(x);
  });

  self.postMessage({ type: WORKER_STATUS.STATUS_READY });
}

const stopping_criteria = new InterruptableStoppingCriteria();
let past_key_values_cache = null;

async function generate(messages) {
  const model = await WLLAMATextGenPipeline.getInstance();
  // model.exit();
  let message = "";
  if (messages.length === 2) {
    message += messages[0].content + "\n" + messages[1].content;
  }
  console.log("message test:", message);

  self.postMessage({ status: WORKER_STATUS.GENERATION_START });

  const outputText = await model.createCompletion(message, {
    nPredict: 50,
    sampling: {
      temp: 0.5,
      top_k: 40,
      top_p: 0.9,
    },
    useCache: true,
    onNewToken: (token, piece, currentText, optionals) => {
      self.postMessage({
        type: WORKER_STATUS.GENERATION_UPDATE,
        data: {
          output: currentText,
          status: "answering",
          format: ModelFormat.GGUF,
        },
      });
    },
  });
  console.log(outputText);
  self.postMessage({
    type: WORKER_STATUS.GENERATION_UPDATE,
    data: {
      output: outputText,
      status: "answering",
    },
  });
  self.postMessage({ type: WORKER_STATUS.GENERATION_COMPLETE });
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
