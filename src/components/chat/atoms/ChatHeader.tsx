import { Menu, MoreVertical, X, Cpu, HardDrive, ArrowLeft } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { LLMController } from "../../../controllers/LLMController";
import { EVENT_TYPES, eventEmitter } from "../../../controllers/events";
import { useAtom, useSetAtom } from "jotai";
import { ModeValues } from "../../types";
import { uiModeAtom } from "../../../stores/ui.store";

// Model type definition
interface Model {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isFocused: boolean;
}

// System resources interface
interface SystemResources {
  ram: {
    total: string;
    used: string;
    percentage: number;
  };
  vram: {
    total: string;
    used: string;
    percentage: number;
  };
}

const ChatHeader = ({ toggleSidebar }: {
  toggleSidebar: () => void;
}) => {
  // Sample active models - replace with your actual state management
  const [activeModels, setActiveModels] = useState<Model[]>([]);

  // Mock system resources - replace with actual data fetching
  const [resources, setResources] = useState<SystemResources>();

  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showTerminatePrompt, setShowTerminatePrompt] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showResourceInfo, setShowResourceInfo] = useState<'ram' | 'vram' | null>(null);
  const [mode, setMode] = useAtom(uiModeAtom);


  const activateBackButton = useMemo(() => {
    return mode == ModeValues.Manage || mode == ModeValues.Create || mode == ModeValues.Manage;
  }, [mode])

  const llmController = useRef<LLMController>(LLMController.getInstance())

  const updateRunningModels = (modelIdList: string[]) => {
    const models = modelIdList.map(id => llmController.current.getModelInfo(id) as unknown as Model)
    setActiveModels(models)
  }

  // Detect mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };


    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    eventEmitter.on(EVENT_TYPES.MODEL_READY, updateRunningModels)
    eventEmitter.on(EVENT_TYPES.MODEL_DELETED, updateRunningModels)
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      eventEmitter.off(EVENT_TYPES.MODEL_READY, updateRunningModels)
      eventEmitter.off(EVENT_TYPES.MODEL_DELETED, updateRunningModels)
    };
  }, []);

  const trimToFirstNonZero = useCallback((num: number): string => {
    if (num === 0) return '0'; // 0이면 바로 반환

    let str = num.toString(); // 문자열 변환
    let match = str.match(/^-?0\.\d*?[1-9]/); // 0이 아닌 첫 숫자까지 찾기

    return match ? parseFloat(match[0]).toString() : num.toString(); // 매칭된 값 반환
  }, [])

  // Simulate fetching system resources
  useEffect(() => {
    // This would be replaced with actual API calls to get system information 1024 ** 3)
    const fetchResources = async () => {
      const ramInfo = await LLMController.getInstance().getMemoryUsage()
      // Mock data updates - replace with actual data fetching logic
      setResources(({
        ram: {
          total: ramInfo.jsHeap.limit.toFixed(0) + 'GB',
          used: trimToFirstNonZero(ramInfo.jsHeap.used / (1024 ** 3)) + 'GB',
          percentage: (ramInfo.jsHeap.used / (ramInfo.jsHeap.limit * (1024 ** 3))) * 100,
        },
        vram: {
          total: (ramInfo.webGPU.total / (1024 ** 3)).toFixed(0) + 'GB',
          used: trimToFirstNonZero(ramInfo.webGPU.used / (1024 ** 3)) + 'GB',
          percentage: (ramInfo.webGPU.used / ramInfo.webGPU.total) * 100,
        }
      }));
    };

    const interval = setInterval(() => {
      fetchResources();
    }, 5000);

    fetchResources(); // Initial fetch

    return () => clearInterval(interval);
  }, []);


  // Function to remove a model
  const removeModel = (modelId: string) => {
    llmController.current.deleteWorker(modelId)
    setShowTerminatePrompt(null);
  };

  // Toggle dropdown menu
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  // Handle long press for mobile
  const handleLongPress = (modelId: string) => {
    if (isMobile) {
      setShowTerminatePrompt(modelId);
    }
  };

  // Set focus to a model
  // const setFocus = (modelId: string) => {
  //   // setActiveModels(activeModels.map(model => ({
  //   //   ...model,
  //   // })));
  // };

  const editPersona = useCallback(() => {
    setMode(ModeValues.Manage) //import
  }, []);

  const onBack = useCallback(() => {
    setMode(ModeValues.Import)
  }
    , []);


  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
      {activateBackButton && <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Chat</span>
      </button>}
      <div className="flex items-center space-x-4">
        <button
          className="md:hidden"
          onClick={toggleSidebar}
          data-tour="sidebar-toggle"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>

        {/* Active models displayed as profile circles - aligned left */}
        <div className="flex -space-x-2">
          {activeModels.map((model) => (
            <div
              key={model.id}
              className="relative"
              onMouseEnter={() => setHoveredModel(model.id)}
              onMouseLeave={() => setHoveredModel(null)}
              // onClick={() => setFocus(model.id)}
              onTouchStart={() => {
                const timer = setTimeout(() => handleLongPress(model.id), 800);
                return () => clearTimeout(timer);
              }}
            >
              <div
                className={`w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center border-2 
                 
                  cursor-pointer relative`}
              // ${model.isFocused ? 'border-blue-500' : 'border-white'} 
              >
                {model.name.charAt(0)}

                {/* Tooltip on hover */}
                {hoveredModel === model.id && (
                  <div className="absolute z-10 w-48 bg-white rounded-md shadow-lg top-12 left-0 p-2 text-sm">
                    <p className="font-bold">{model.name}</p>
                    <p className="text-gray-600 text-xs">{model.description}</p>
                  </div>
                )}

                {/* X button on hover for desktop */}
                {!isMobile && hoveredModel === model.id && (
                  <button
                    className="absolute -top-2 -right-2 bg-gray-100 rounded-full p-1 shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeModel(model.id);
                    }}
                  >
                    <X className="h-3 w-3 text-gray-600" />
                  </button>
                )}

                {/* Terminate prompt for mobile */}
                {isMobile && showTerminatePrompt === model.id && (
                  <div className="absolute z-20 w-48 bg-white rounded-md shadow-lg top-12 left-0 p-2 text-sm">
                    <p>Terminate this model?</p>
                    <div className="flex justify-end mt-2">
                      <button
                        className="px-2 py-1 text-xs bg-gray-200 rounded mr-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTerminatePrompt(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeModel(model.id);
                        }}
                      >
                        Terminate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side with system resources and menu */}
      <div className="flex items-center space-x-4">
        {/* RAM Usage */}
        <div
          className="relative"
          onMouseEnter={() => setShowResourceInfo('ram')}
          onMouseLeave={() => setShowResourceInfo(null)}
        >
          {resources && <div className="flex items-center space-x-1">
            <Cpu className={`h-5 w-5 ${resources.ram.percentage > 80 ? 'text-red-500' : 'text-gray-600'}`} />
            {!isMobile && (
              <span className="text-xs font-medium">{resources.ram.used}/{resources.ram.total}</span>
            )}
          </div>}

          {/* RAM usage tooltip  */}
          {resources && showResourceInfo === 'ram' && (
            <div className="absolute z-10 w-48 bg-white rounded-md shadow-lg -bottom-24 right-0 p-2 text-sm">
              <p className="font-bold">RAM Usage</p>
              <div className="mt-1 bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${resources.ram.percentage > 90 ? 'bg-red-600' :
                    resources.ram.percentage > 75 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}
                  style={{ width: `${resources.ram.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs">{resources.ram.percentage.toFixed(1)}% used</span>
                <span className="text-xs">{resources.ram.used} of {resources.ram.total}</span>
              </div>
            </div>
          )}
        </div>

        {/* VRAM Usage */}
        <div
          className="relative"
          onMouseEnter={() => setShowResourceInfo('vram')}
          onMouseLeave={() => setShowResourceInfo(null)}
        >
          {resources && <div className="flex items-center space-x-1">
            <HardDrive className={`h-5 w-5 ${resources.vram.percentage > 80 ? 'text-red-500' : 'text-gray-600'}`} />
            {!isMobile && (
              <span className="text-xs font-medium">{resources.vram.used}/{resources.vram.total}</span>
            )}
          </div>}

          {/* VRAM usage tooltip  */}
          {resources && showResourceInfo === 'vram' && (
            <div className="absolute z-10 w-48 bg-white rounded-md shadow-lg -bottom-24 right-0 p-2 text-sm">
              <p className="font-bold">VRAM Usage</p>
              <div className="mt-1 bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${resources.vram.percentage > 90 ? 'bg-red-600' :
                    resources.vram.percentage > 75 ? 'bg-orange-500' :
                      'bg-green-500'
                    }`}
                  style={{ width: `${resources.vram.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs">{resources.vram.percentage.toFixed(1)}% used</span>
                <span className="text-xs">{resources.vram.used} of {resources.vram.total}</span>
              </div>
            </div>
          )}
        </div>

        {/* Menu button with dropdown */}
        <div className="relative">
          <button onClick={toggleMenu}>
            <MoreVertical className="h-6 w-6 text-gray-600" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={editPersona}
                >
                  Edit Persona
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Edit Model
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatHeader);