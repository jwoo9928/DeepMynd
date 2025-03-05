import {
  BaseStreamer,
  InterruptableStoppingCriteria,
} from "@huggingface/transformers";
import {
  ImageGenerationPipeline,
  StableDefusionImageGenerationPipeline,
} from "../../pipelines/ImageGenerationPipeline";
import { WORKER_STATUS, WORKER_EVENTS } from "./event";

/**
 * Helper function to perform feature detection for WebGPU
 */

class ProgressStreamer extends BaseStreamer {
  constructor(total, on_progress) {
    super();
    this.total = total;
    this.on_progress = on_progress;

    this.count = null;
    this.start_time = null;
  }

  put(value) {
    if (this.count === null) {
      // Ignore the first batch of tokens (prompt)
      this.count = 0;
      this.start_time = performance.now();
      return;
    }

    const progress = ++this.count / this.total;

    this.on_progress({
      count: this.count,
      total: this.total,
      progress,
      time: performance.now() - this.start_time,
    });
  }

  end() {
    /* no nothing */
  }
}

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

async function load() {
  self.postMessage({ type: WORKER_STATUS.STATUS_LOADING });

  await StableDefusionImageGenerationPipeline.getInstance((x) => {
    self.postMessage(x);
  });

  self.postMessage({ type: WORKER_STATUS.STATUS_READY });
}

/**
 * This class uses the Singleton pattern to enable lazy-loading of the pipeline
 */

// const stopping_criteria = new InterruptableStoppingCriteria();
// let past_key_values_cache = null;

// async function generate(message) {
//   const [processor, model] = await ImageGenerationPipeline.getInstance();

//   const conversation = [
//     {
//       role: "<|User|>", // uses title case
//       content: message,
//     },
//   ];
//   const inputs = await processor(conversation, {
//     chat_template: "text_to_image",
//   });

//   const callback_function = (output) => {
//     self.postMessage({
//       status: "image-update",
//       ...output,
//     });
//   };

//   const num_image_tokens = processor.num_image_tokens;

//   const streamer = new ProgressStreamer(num_image_tokens, callback_function);

//   self.postMessage({ status: WORKER_STATUS.GENERATION_START });

//   // @ts-ignore
//   const outputs = await model.generate_images({
//     ...inputs,
//     min_new_tokens: num_image_tokens,
//     max_new_tokens: num_image_tokens,
//     do_sample: true,
//     streamer,
//   });

//   const blob = await outputs[0].toBlob();

//   self.postMessage({ type: WORKER_STATUS.IMAGE_GEN_COMPLETE, data: { blob } });
// }

async function generate(message) {
  const [pipe] = await StableDefusionImageGenerationPipeline.getInstance();
  let image = pipe.run(message);
  // prompt: string
  // negativePrompt?: string
  // guidanceScale?: number
  // seed?: string
  // width?: number
  // height?: number
  // numInferenceSteps: number
  // sdV1?: boolean
  // progressCallback?: ProgressCallback
  // runVaeOnEachStep?: boolean
  // img2imgFlag?: boolean
  // inputImage?: Float32Array
  // strength?: number
}

self.addEventListener("message", async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case WORKER_EVENTS.CHECK:
      check();
      break;
    case WORKER_EVENTS.LOAD:
      load();
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
