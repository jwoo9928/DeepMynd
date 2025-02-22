export enum ModelFormat {
    ONNX = 'onnx',
    GGUF = 'gguf',
    MLC = 'mlc'
}

export interface Model {
    id: string;
    model_id: string;
    name: string;
    format: ModelFormat;
    size: string;
    description: string;
    vram_required_MB?:number;
}

export type ModelList = Record<ModelFormat, Model[]>;