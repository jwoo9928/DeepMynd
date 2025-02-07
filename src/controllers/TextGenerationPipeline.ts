import { AutoModelForCausalLM, AutoTokenizer, pipeline, PreTrainedTokenizer, ProgressCallback } from "@huggingface/transformers";

export class TextGenerationPipeline {
    static model_id = "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";
    static tokenizer: Promise<PreTrainedTokenizer> | null = null;
    static model: Promise<AutoModelForCausalLM> | null = null;

    static async getInstance(progress_callback: ((x: any) => void) | null = null): Promise<[PreTrainedTokenizer, AutoModelForCausalLM]> {
        this.tokenizer ??= AutoTokenizer.from_pretrained(this.model_id, {
            progress_callback: progress_callback || undefined,
        });

        this.model ??= AutoModelForCausalLM.from_pretrained(this.model_id, {
            dtype: "q4f16",
            device: "webgpu",
            progress_callback: progress_callback || undefined,
        });

        return Promise.all([this.tokenizer, this.model]);
    }
}


export class NomalPipeline {
    static model_id = "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";
    static instance: TextGenerationPipeline | null = null;

    static async getInstance(progress_callback = undefined): Promise<TextGenerationPipeline> {

        if (this.instance === null) {
            this.instance = await pipeline("text-generation", this.model_id, {
                device: "webgpu",
                progress_callback,
            });
        }

        return this.instance;
    }
}