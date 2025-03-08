export enum ModelFormat {
    ONNX = 'onnx',
    GGUF = 'gguf',
    MLC = 'mlc'
}

export enum DeviceType {
    GPU = 'gpu',
    CPU = 'cpu'
}

export interface Model {
    id: string;
    model_id: string;
    name: string;
    format: ModelFormat;
    size: number;
    description: string;
    vram_required_MB?:number;
    available: DeviceType;
    limit: number;

}

export type ModelList = Record<ModelFormat, Model[]>;