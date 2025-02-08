import {
  AutoModelForCausalLM,
  AutoProcessor,
  MultiModalityCausalLM,
  Processor,
} from "@huggingface/transformers";


export class ImageGenerationPipeline {
    static model_id = "onnx-community/Janus-Pro-1B-ONNX";
      static processor: Promise<Processor> | null = null;
      static model: Promise<AutoModelForCausalLM> | null = null;
      
  
    static async getInstance(progress_callback: ((x: any) => void) | null = null) {
      this.processor ??= AutoProcessor.from_pretrained(this.model_id, {
        progress_callback,
      });
      //@ts-ignore
      const adapter = await navigator.gpu.requestAdapter();
      const fp16_supported = adapter.features.has("shader-f16") ?? false;
  
      this.model ??= MultiModalityCausalLM.from_pretrained(this.model_id, {
        dtype: fp16_supported
          ? {
              prepare_inputs_embeds: "q4",
              language_model: "q4f16",
              lm_head: "fp16",
              gen_head: "fp16",
              gen_img_embeds: "fp16",
              image_decode: "fp32",
            }
          : {
              prepare_inputs_embeds: "fp32",
              language_model: "q4",
              lm_head: "fp32",
              gen_head: "fp32",
              gen_img_embeds: "fp32",
              image_decode: "fp32",
            },
        device: {
          prepare_inputs_embeds: "wasm", // TODO use "webgpu" when bug is fixed
          language_model: "webgpu",
          lm_head: "webgpu",
          gen_head: "webgpu",
          gen_img_embeds: "webgpu",
          image_decode: "webgpu",
        },
        progress_callback : progress_callback || undefined,
      });
  
      return Promise.all([this.processor, this.model]);
    }
  }