import {
  AutoModelForCausalLM,
  AutoProcessor,
  MultiModalityCausalLM,
  Processor,
} from "@huggingface/transformers";
import { Wllama } from "@wllama/wllama";
import WasmFromCDN from "@wllama/wllama/esm/wasm-from-cdn";


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


  export class WLLAMImageGenPipeline {
    static model_id: string | null = null;
    static modelfile: string | null = null;
    static model: Wllama | null = null;

    static async getInstance(model_id: string,modelfile: string, progress_callback: ((x: any) => void) | null = null): Promise<Wllama> {
        this.model_id = model_id;
        this.modelfile = modelfile;
        if (this.model === null) {
            this.model = new Wllama(WasmFromCDN, {
                parallelDownloads: 3,
                logger: console,
            });

            await this.model.loadModelFromHF(
                this.model_id,
                this.modelfile,
                {
                    progressCallback: (value) => {
                        let fitlered_value = {
                            name:  this.model_id,
                            loaded: value.loaded,
                            total: value.total,
                            progress: value.loaded / value.total * 100,
                            status: value.loaded != value.total ? 'progress' : 'done',
                            file: this.modelfile
                        }
                        if (progress_callback) {
                            progress_callback(fitlered_value);
                        }
                    },
                    n_ctx: 4096,
                }
            );
        }

        return this.model;
    }


}