import { pipeline, TextStreamer } from "@huggingface/transformers";
import { WORKER_STATUS, WORKER_EVENTS } from "./event";

class SentenceQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(sentence) {
    this.queue.push(sentence);
  }

  async dequeue() {
    return this.queue.shift();
  }

  length() {
    return this.queue.length;
  }
}

let translator;
let streamer;
let buffer = [];
let origin = [];
let queue = new SentenceQueue();

async function load() {
  self.postMessage({ type: WORKER_STATUS.TRANSLATOR_LOADING });

  translator = await pipeline("translation", "Xenova/nllb-200-distilled-600M");

  const callback_function = (output) => {
    self.postMessage({
      type: WORKER_STATUS.TRANSLATION_UPDATE,
      data: {
        output,
      },
    });
  };

  streamer = new TextStreamer(translator.tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function,
  });

  self.postMessage({ type: WORKER_STATUS.TRANSLATOR_READY });
}

/**
 * This class uses the Singleton pattern to enable lazy-loading of the pipeline
 */

async function generate(data) {
  const { output } = data;
  buffer.push(output);
  if (/[.!?]/.test(output)) {
    // 문장 끝 확인
    const completeSentence = buffer.join(" ");
    queue.enqueue(completeSentence.trim()); // 큐에 저장
    buffer = [];
  } else {
    return;
  }
  const sentence = await queue.dequeue();
  origin.push(sentence);
  await translator(sentence, {
    src_lang: "eng_Latn", // Hindi
    tgt_lang: "kor_Hang", // French
    streamer: streamer,
  });

  if (buffer.length === 0 && queue.length() === 0) {
    self.postMessage({
      type: WORKER_STATUS.TRANSLATION_COMPLETE,
      data: { output: origin.join(" ") },
    });
    origin = [];
  }
}

async function translate(text) {
  const result = await translator(text, {
    src_lang: "kor_Hang", // Hindi
    tgt_lang: "eng_Latn", // French
  });
  self.postMessage({
    type: WORKER_EVENTS.TRANSLATION_END,
    data: {
      output: result,
    },
  });
}

async function stop_generate() {}

self.addEventListener("message", async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case WORKER_EVENTS.LOAD:
      load();
      break;
    case WORKER_EVENTS.GENERATION:
      generate(data);
      break;
    case WORKER_EVENTS.TRANSLATION_ALL:
      translate(data);
      break;
    case WORKER_EVENTS.GENERATION_STOP:
      stop_generate();
      break;
  }
});
