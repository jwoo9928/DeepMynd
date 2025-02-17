import { AutoModelForCausalLM, AutoTokenizer, pipeline, PreTrainedTokenizer } from "@huggingface/transformers";
import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm';
import { Wllama } from "@wllama/wllama";
import WasmFromCDN from '@wllama/wllama/esm/wasm-from-cdn.js';

export class TextGenerationPipeline {
    static model_id: string| null = null //"onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";
    static tokenizer: Promise<PreTrainedTokenizer> | null = null;
    static model: Promise<AutoModelForCausalLM> | null = null;

    static async getInstance(model_id?: string, progress_callback: ((x: any) => void) | null = null): Promise<[PreTrainedTokenizer, AutoModelForCausalLM]> {
        model_id ??= this.model_id ?? "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";
        this.tokenizer ??= AutoTokenizer.from_pretrained(model_id, {
            progress_callback: progress_callback || undefined,
        });

        this.model ??= AutoModelForCausalLM.from_pretrained(model_id, {
            dtype: "q4f16",
            device: "webgpu",
            progress_callback: progress_callback || undefined,
        });

        return Promise.all([this.tokenizer, this.model]);
    }
}


export class NormalTextGenePipeline {
    static model_id = "meta-llama/Llama-3.2-1B"//"onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";
    static model: Promise<MLCEngine> | null = null;

    static async getInstance(progress_callback = undefined):Promise<[MLCEngine]> {
        this.model ??= CreateMLCEngine(
            this.model_id,
            { initProgressCallback: progress_callback }, // engineConfig
        );

        return Promise.all([this.model]);
    }
}

export class WLLAMATextGenPipeline {
    static model_id = "UnfilteredAI/NSFW-3B";
    static model: Wllama | null = null;

    static async getInstance(progress_callback = undefined): Promise<Wllama> {
        if (this.model === null) {
            this.model = new Wllama(WasmFromCDN, {
                parallelDownloads: 3,
                logger: console,
            });

            await this.model.loadModelFromHF(
                'UnfilteredAI/NSFW-3B',
                'nsfw-3b-iq4_xs-imat.gguf',
                {
                    progressCallback: (value) => {
                        let fitlered_value = {
                            name: 'UnfilteredAI/NSFW-3B',
                            loaded: value.loaded,
                            total: value.total,
                            progress: value.loaded / value.total * 100,
                            status: value.loaded != value.total ? 'progress' : 'done',
                            file: 'nsfw-3b-iq4_xs-imat.gguf'
                        }
                        //@ts-ignore
                        progress_callback(fitlered_value);
                    }
                }
            );
        }

        return this.model;
    }


}