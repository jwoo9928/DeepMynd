import { Cpu, Search, Zap } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DeviceType, Model, ModelFormat, ModelList } from "./types";
import { EVENT_TYPES, eventEmitter } from "../../controllers/utils/events";
import { LLMController } from "../../controllers/LLMController";
import CustomDropdown from "../chat/atoms/CustomDropDown";

const ModelListSection = ({
  selectedFormat,
  selectedModel,
  quantizationType,
  handleSelect,
}: {
  selectedFormat: ModelFormat;
  selectedModel: Model | null;
  quantizationType?: string;
  handleSelect: (model: Model, qType?: string) => void;

}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [AVAILABLE_MODELS, setAVAILABLE_MODELS] = useState<ModelList>(
    LLMController.getInstance().getModelList() as ModelList
  );

  // Optimize model filtering with useMemo
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return AVAILABLE_MODELS[selectedFormat];

    const lowerSearchTerms = searchQuery.trim().toLowerCase().split(/\s+/);
    return AVAILABLE_MODELS[selectedFormat].filter(({ name, description = '' }) => {
      const lowerName = name.toLowerCase();
      const lowerDesc = description.toLowerCase();

      return lowerSearchTerms.every(term =>
        lowerName.includes(term) || lowerDesc.includes(term)
      );
    });
  }, [searchQuery, selectedFormat, AVAILABLE_MODELS]);

  // Memoized event handler to prevent unnecessary re-renders
  const handleModelSelection = useCallback((model: Model) => {
    if (model.id !== selectedModel?.id) {
      handleSelect(model, model?.option?.quantization_types[0]);
    }
  }, [selectedModel]);

  const setQuantizationType = useCallback((value: string) => {
    handleSelect(selectedModel as Model, value);
  }, [selectedModel]);

  // Memoized conversion function
  const mbToGb = useCallback((mb: number) => {
    return (mb / 1024).toFixed(2);
  }, []);

  // Set up event listener with cleanup
  useEffect(() => {
    const updateModels = (models: ModelList) => setAVAILABLE_MODELS(models);
    eventEmitter.on(EVENT_TYPES.MODELS_UPDATED, updateModels);
    return () => {
      eventEmitter.off(EVENT_TYPES.MODELS_UPDATED, updateModels);
    };
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
          className="w-full p-3 pl-10 border border-gray-200 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 
                     transition-all duration-200"
        />
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
      </div>

      {/* Scrollable Model List */}
      <div className="h-80 overflow-y-auto pr-2 space-y-4">
        {filteredModels.length > 0 ? (
          filteredModels.map((model) => (
            <div
              key={model.id}
              onClick={() => handleModelSelection(model)}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${selectedModel?.id === model.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-grow">
                  <h3 className="font-medium text-gray-900">{model.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{model.description}</p>
                  <div className="flex items-center space-x-4 mt-2 flex-wrap gap-2">
                    <span className="text-xs text-gray-400">Size: {mbToGb(model.size)}GB</span>
                    {model.available === DeviceType.CPU && (
                      <div className="flex items-center text-sm border rounded-full px-2 py-1 bg-blue-50">
                        <Cpu className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-xs">CPU Powered</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm border rounded-full px-2 py-1 bg-yellow-50">
                      <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                      <span className="text-xs">GPU Accelerated</span>
                    </div>
                    {/* Quantization Dropdown */}
                    {selectedModel?.id === model.id && selectedModel?.option &&
                      selectedModel?.option?.quantization_types.length > 0 && (
                        <CustomDropdown
                          options={selectedModel.option.quantization_types}
                          selectedValue={quantizationType ?? "-"}
                          onSelect={setQuantizationType}
                        />
                      )}
                  </div>
                </div>
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
};

export default React.memo(ModelListSection);