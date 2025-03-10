import { Menu, MoreVertical, X, Cpu, HardDrive, Info } from "lucide-react";
import React, { useState, useEffect } from "react";
import { LLMController } from "../../../controllers/LLMController";

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
    total: number;
    used: number;
    percentage: number;
  };
  vram: {
    total: number;
    used: number;
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

  // Detect mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Simulate fetching system resources
  useEffect(() => {
    // This would be replaced with actual API calls to get system information 1024 ** 3)
    // const fetchResources = async() => {
    //    const ramInfo = await LLMController.getInstance().getMemoryUsage()
    //     // Mock data updates - replace with actual data fetching logic
    //     setResources(prev => ({
    //         ram: {
    //             total:ramInfo.jsHeap.limit / (1024 ** 3),
    //             used: ramInfo.jsHeap.used / (1024 ** 3),
    //             percentage: (ramInfo.jsHeap.used / ramInfo.jsHeap.total) * 100,
    //         },
    //         vram: {
    //             total: ramInfo.webGPU.total / (1024 ** 3),
    //             used: ramInfo.webGPU.used / (1024 ** 3),
    //             percentage: (ramInfo.jsHeap.used / ramInfo.jsHeap.total) * 100,
    //         }
    //     }));
    // };

    // const interval = setInterval(() => {
    //   fetchResources();
    // }, 5000);

    // fetchResources(); // Initial fetch
    
    // return () => clearInterval(interval);
  }, []);


  // Function to remove a model
  const removeModel = (modelId: string) => {
    setActiveModels(activeModels.filter(model => model.id !== modelId));
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
  const setFocus = (modelId: string) => {
    setActiveModels(activeModels.map(model => ({
      ...model,
      isFocused: model.id === modelId
    })));
  };

  // Format GB values
  const formatGB = (value: number): string => {
    return value.toFixed(1) + 'GB';
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
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
              onClick={() => setFocus(model.id)}
              onTouchStart={() => {
                const timer = setTimeout(() => handleLongPress(model.id), 800);
                return () => clearTimeout(timer);
              }}
            >
              <div 
                className={`w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center border-2 
                  ${model.isFocused ? 'border-blue-500' : 'border-white'} 
                  cursor-pointer relative`}
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
        {/* <div 
          className="relative"
          onMouseEnter={() => setShowResourceInfo('ram')}
          onMouseLeave={() => setShowResourceInfo(null)}
        >
          {resources && <div className="flex items-center space-x-1">
            <Cpu className={`h-5 w-5 ${resources.ram.percentage > 80 ? 'text-red-500' : 'text-gray-600'}`} />
            {!isMobile && (
              <span className="text-xs font-medium">{formatGB(resources.ram.used)}/{formatGB(resources.ram.total)}</span>
            )}
          </div>}
          
          { RAM usage tooltip }
          {resources && showResourceInfo === 'ram' && (
            <div className="absolute z-10 w-48 bg-white rounded-md shadow-lg -bottom-24 right-0 p-2 text-sm">
              <p className="font-bold">RAM Usage</p>
              <div className="mt-1 bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    resources.ram.percentage > 90 ? 'bg-red-600' : 
                    resources.ram.percentage > 75 ? 'bg-orange-500' : 
                    'bg-blue-500'
                  }`} 
                  style={{ width: `${resources.ram.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs">{resources.ram.percentage.toFixed(1)}% used</span>
                <span className="text-xs">{formatGB(resources.ram.used)} of {formatGB(resources.ram.total)}</span>
              </div>
            </div>
          )}
        </div> */}
        
        {/* VRAM Usage */}
        {/* <div 
          className="relative"
          onMouseEnter={() => setShowResourceInfo('vram')}
          onMouseLeave={() => setShowResourceInfo(null)}
        >
          {resources&&<div className="flex items-center space-x-1">
            <HardDrive className={`h-5 w-5 ${resources.vram.percentage > 80 ? 'text-red-500' : 'text-gray-600'}`} />
            {!isMobile && (
              <span className="text-xs font-medium">{formatGB(resources.vram.used)}/{formatGB(resources.vram.total)}</span>
            )}
          </div>}
          
          {/VRAM usage tooltip }
          {resources && showResourceInfo === 'vram' && (
            <div className="absolute z-10 w-48 bg-white rounded-md shadow-lg -bottom-24 right-0 p-2 text-sm">
              <p className="font-bold">VRAM Usage</p>
              <div className="mt-1 bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    resources.vram.percentage > 90 ? 'bg-red-600' : 
                    resources.vram.percentage > 75 ? 'bg-orange-500' : 
                    'bg-green-500'
                  }`} 
                  style={{ width: `${resources.vram.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs">{resources.vram.percentage.toFixed(1)}% used</span>
                <span className="text-xs">{formatGB(resources.vram.used)} of {formatGB(resources.vram.total)}</span>
              </div>
            </div>
          )}
        </div> */}

        {/* Menu button with dropdown */}
        <div className="relative">
          <button onClick={toggleMenu}>
            <MoreVertical className="h-6 w-6 text-gray-600" />
          </button>
          
          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
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