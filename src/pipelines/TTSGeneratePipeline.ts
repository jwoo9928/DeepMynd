import { KokoroTTS, TextSplitterStream } from "kokoro-js";

export class TextGenerationPipeline {
    static model_id: string = 'onnx-community/Kokoro-82M-v1.0-ONNX'
    static splitter: TextSplitterStream | null = null;
    static model: Promise<KokoroTTS> | null = null;

    static async getInstance(progress_callback: ((x: any) => void) | null = null): Promise<[TextSplitterStream, KokoroTTS]> {
        this.model ??= KokoroTTS.from_pretrained(this.model_id, {
            dtype: "q4", // Options: "fp32", "fp16", "q8", "q4", "q4f16"
            device: "webgpu", // Options: "wasm", "webgpu" (web) or "cpu" (node).
            progress_callback: progress_callback || undefined,
        });
        this.splitter = new TextSplitterStream();

        return Promise.all([this.splitter, this.model]);
    }
}
