import { AutoModelForCausalLM, AutoTokenizer, PreTrainedTokenizer } from "@huggingface/transformers";
import { CreateMLCEngine, InitProgressCallback, MLCEngine } from '@mlc-ai/web-llm';
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

    static async getInstance(model_id?: string, progress_callback?: InitProgressCallback): Promise<[MLCEngine]> {
        this.model_id = model_id ?? this.model_id;
        this.model ??= CreateMLCEngine(
            this.model_id,
            { initProgressCallback: progress_callback }, // engineConfig1 import { Suspense, useEffect } from 'react'
        );

        return Promise.all([this.model]);
    }
}

export class WLLAMATextGenPipeline {
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
                        console.log("value",value)
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