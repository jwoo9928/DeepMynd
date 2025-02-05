import React, { useRef } from "react";
import { LLMController } from "../\bcontrollers/LLMController";
import { ProgressItem } from "../\bcontrollers/types";

interface InitializeProps {
    status: 'loading' | 'ready' | null;
    progressItems: ProgressItem[];
    loadingMessage: string;
    error: string | null;
    handleLoadModel: () => void;
}

const Initialize = ({
    status,
    progressItems,
    loadingMessage,
    error,
    handleLoadModel
}: InitializeProps) => {
    const llmController = useRef(LLMController.getInstance());

    // if (!llmController.current.isAvailable()) {
    //     return (
    //         <div className="fixed w-screen h-screen bg-black z-10 bg-opacity-[92%] text-white text-2xl font-semibold flex justify-center items-center text-center">
    //             WebGPU is not supported<br />by this browser :&#40;
    //         </div>
    //     );
    // }

    if (status === 'loading') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                <div className="w-full max-w-[500px] p-4">
                    <h2 className="text-xl font-semibold mb-4 text-center">{loadingMessage}</h2>
                    {progressItems.map((item, index) => (
                        <div key={index} className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span>{item.file}</span>
                                <span>{Math.round((item.loaded / item.total) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(item.loaded / item.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (status === null) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                <div className="max-w-[500px] text-center p-4">
                    <img
                        src="logo.png"
                        alt="Logo"
                        className="w-4/5 mx-auto mb-6 drop-shadow-lg"
                    />
                    <h1 className="text-4xl font-bold mb-4">DeepSeek-R1 WebGPU</h1>
                    <p className="mb-6">
                        A next-generation reasoning model that runs locally in your browser with WebGPU acceleration.
                    </p>
                    {error && (
                        <div className="text-red-500 mb-4">
                            <p className="font-semibold">Error loading model:</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    <button
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        onClick={handleLoadModel}
                        disabled={!!error}
                    >
                        Load Model
                    </button>
                </div>
            </div>
        );
    }

}

export default React.memo(Initialize)