export type ONNX = 'onnx';
export type GGUF = 'gguf';
export type MLC = 'mlc';
export type ModelFormat = ONNX| GGUF | MLC;

export interface Model {
    id: string;
    name: string;
    format: ModelFormat;
    size: string;
    description: string;
}