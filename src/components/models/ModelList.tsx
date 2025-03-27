import { ChevronRight, Cpu, Search, Zap } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { DeviceType, Model, ModelFormat, ModelList } from "./types";
import { EVENT_TYPES, eventEmitter } from "../../controllers/utils/events";
import { LLMController } from "../../controllers/LLMController";

const ModelListSection = ({
  selectedFormat,
  selectedModel,
  setSelectedModel,
}: {
  selectedFormat: ModelFormat;
  selectedModel: Model | null;
  setSelectedModel: (model: Model) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [AVAILABLE_MODELS, setAVAILABLE_MODELS] = useState<ModelList>(LLMController.getInstance().getModelList() ?? {
    onnx: [],
    gguf: [],
    mlc: [],
  });

  useEffect(() => {
    eventEmitter.on(EVENT_TYPES.MODELS_UPDATED, setAVAILABLE_MODELS);
    return () => {
      eventEmitter.off(EVENT_TYPES.MODELS_UPDATED, setAVAILABLE_MODELS);
    };
  }, []);

  useEffect(() => {
    if (searchQuery != '') {
      const lowerSearchTerms = searchQuery.trim().toLowerCase().split(/\s+/);
      const filtered = AVAILABLE_MODELS[selectedFormat].filter(({ name, description = '' }) => {
        if (!searchQuery.trim()) return true; // 빈 검색어 처리

        const lowerName = name.toLowerCase();
        const lowerDesc = description.toLowerCase();

        return lowerSearchTerms.every(term =>
          lowerName.indexOf(term) !== -1 || lowerDesc.indexOf(term) !== -1
        );
      });
      setFilteredModels(filtered);
    } else {
      setFilteredModels(AVAILABLE_MODELS[selectedFormat]);
    }
  }, [searchQuery, selectedFormat]);

  const mbToGb = useCallback((mb: number) => {
    return (mb / 1024).toFixed(2);
  }, []);


  return (
    <div className="flex flex-col space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
      </div>

      {/* Scrollable Model List */}
      <div className="h-80 overflow-y-auto pr-2 space-y-4">
        {filteredModels.length > 0 ? (
          filteredModels.map((model) => (
            <div
              key={model.id}
              onClick={() => setSelectedModel(model)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedModel?.id === model.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{model.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{model.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-400">Size: {mbToGb(model.size)}GB</span>
                    {/* <span className="text-xs text-gray-400">VRAM: {model.limit}GB</span> */}
                    {model.available == DeviceType.CPU && (
                      <div className="flex items-center text-sm border rounded-full px-2 py-1 bg-blue-50">
                        <Cpu className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-xs">CPU Powered</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm border rounded-full px-2 py-1 bg-yellow-50">
                      <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                      <span className="text-xs">GPU Accelerated</span>
                    </div>
                  </div>
                </div>
                {selectedModel?.id === model.id && (
                  <div className="text-blue-500">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            No models match your search criteria
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(ModelListSection);