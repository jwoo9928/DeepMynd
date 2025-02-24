import { ChevronRight, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Model, ModelFormat, ModelList } from "./types";
import { EVENT_TYPES, eventEmitter } from "../../controllers/events";
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
  const [AVAILABLE_MODELS, setAVAILABLE_MODELS] = useState<ModelList>({
    onnx: [],
    gguf: [],
    mlc: [],
  });

  useEffect(() => {
    let list = LLMController.getInstance().getModelList();
    if (list) {
      setAVAILABLE_MODELS(list);
    }
    eventEmitter.on(EVENT_TYPES.MODELS_UPDATED, setAVAILABLE_MODELS);
    return () => {
      eventEmitter.off(EVENT_TYPES.MODELS_UPDATED, setAVAILABLE_MODELS);
    };
  }, []);

  useEffect(() => {
    if (searchQuery != '') {
      const filtered = AVAILABLE_MODELS[selectedFormat].filter(model =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredModels(filtered);
    } else {
      setFilteredModels(AVAILABLE_MODELS[selectedFormat]);
    }
  }, [searchQuery, selectedFormat]);


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
                  <span className="text-xs text-gray-400 mt-2 inline-block">Size: {model.size}</span>
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