import React, { useState } from 'react';
import { X } from 'lucide-react';
import Modal from 'react-modal';

const modalStyles: Modal.Styles = {
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    content: {
        position: 'relative',
        top: 'auto',
        left: 'auto',
        right: 'auto',
        bottom: 'auto',
        width: '70%',
        maxWidth: '42rem',
        maxHeight: '90vh',
        padding: '1.5rem',
        border: 'none',
        borderRadius: '0.75rem',
        backgroundColor: 'white',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    }
};

const HuggingfaceModal = ({
    handleHuggingfaceImport
}: {
    handleHuggingfaceImport: () => void;
}) => {
    const [isHuggingfaceModalOpen, setIsHuggingfaceModalOpen] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState<'onnx' | 'gguf'>('onnx');
    const [huggingfaceModelId, setHuggingfaceModelId] = useState('');
    const [huggingfaceFileName, setHuggingfaceFileName] = useState('');

    return (
        // @ts-ignore
        <Modal
            isOpen={isHuggingfaceModalOpen}
            onRequestClose={() => setIsHuggingfaceModalOpen(false)}
            style={modalStyles}
        >
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Import from Hugging Face</h2>
                    <button
                        onClick={() => setIsHuggingfaceModalOpen(false)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Format
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {['onnx', 'gguf'].map((format) => (
                                <button
                                    key={format}
                                    onClick={() => setSelectedFormat(format as 'onnx' | 'gguf')}
                                    className={`p-4 border rounded-lg text-left transition-all ${selectedFormat === format
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                                        }`}
                                >
                                    <div className="font-medium">{format.toUpperCase()}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Model ID
                        </label>
                        <input
                            type="text"
                            value={huggingfaceModelId}
                            onChange={(e) => setHuggingfaceModelId(e.target.value)}
                            placeholder="e.g., microsoft/resnet-50"
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            File Name
                        </label>
                        <input
                            type="text"
                            value={huggingfaceFileName}
                            onChange={(e) => setHuggingfaceFileName(e.target.value)}
                            placeholder="e.g., model.onnx"
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleHuggingfaceImport}
                        disabled={!huggingfaceModelId || !huggingfaceFileName}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Import
                    </button>
                </div>
            </div>
        </Modal>
    )
};

export default React.memo(HuggingfaceModal);
