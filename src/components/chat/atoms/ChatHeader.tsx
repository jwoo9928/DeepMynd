import { Menu, MoreVertical, X, Cpu, HardDrive, ArrowLeft } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { LLMController } from "../../../controllers/LLMController";
import { EVENT_TYPES, eventEmitter } from "../../../controllers/utils/events";
import { useAtom } from "jotai";
import { ModeValues } from "../../types";
import { uiModeAtom } from "../../../stores/ui.store";
import { Model } from "../../models/types";

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

const ChatHeader: React.FC<{ toggleSidebar: () => void }> = ({ toggleSidebar }) => {
  // 상태 관리
  const [activeModels, setActiveModels] = useState<Model[]>([]);
  const [resources, setResources] = useState<SystemResources>();
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showTerminatePrompt, setShowTerminatePrompt] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showResourceInfo, setShowResourceInfo] = useState<'ram' | 'vram' | null>(null);
  const [mode, setMode] = useAtom(uiModeAtom);

  // LLMController 인스턴스 (ref 사용)
  const llmController = useRef(LLMController.getInstance());

  // 활성 모델 업데이트 (모델 ID 목록을 받아 LLMController를 통해 모델 정보를 가져옴)
  const updateRunningModels = useCallback((modelIdList: string[]) => {
    const models = modelIdList
      .map(id => llmController.current.getModelInfo(id))
      .filter(model => model !== undefined)
    setActiveModels(models);
  }, []);

  // 화면 너비 변화에 따라 모바일 여부 업데이트
  const checkIfMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // 이벤트 구독 및 창 리사이즈 처리 (한번의 useEffect로 통합)
  useEffect(() => {
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    eventEmitter.on(EVENT_TYPES.MODEL_READY, updateRunningModels);
    eventEmitter.on(EVENT_TYPES.MODEL_DELETED, updateRunningModels);
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      eventEmitter.off(EVENT_TYPES.MODEL_READY, updateRunningModels);
      eventEmitter.off(EVENT_TYPES.MODEL_DELETED, updateRunningModels);
    };
  }, [checkIfMobile, updateRunningModels]);

  // 숫자 포맷팅: 0이면 '0', 1보다 큰 경우 소수점 한 자리 고정, 그 외 0이 아닌 첫자리까지 표시
  const trimToFirstNonZero = useCallback((num: number): string => {
    if (num === 0) return '0';
    if (num > 1) return num.toFixed(1);
    const match = num.toString().match(/^-?0\.\d*?[1-9]/);
    return match ? parseFloat(match[0]).toString() : num.toString();
  }, []);

  // 시스템 리소스 (RAM, VRAM) 정보 주기적 업데이트
  useEffect(() => {
    const fetchResources = async () => {
      const ramInfo = await llmController.current.getMemoryUsage();
      setResources({
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
      });
    };

    fetchResources(); // 초기 호출
    const interval = setInterval(fetchResources, 1000);
    return () => clearInterval(interval);
  }, [trimToFirstNonZero]);

  // 모델 삭제
  const removeModel = useCallback((modelId: string) => {
    llmController.current.deleteWorker(modelId);
    setShowTerminatePrompt(null);
  }, []);

  // 드롭다운 메뉴 토글
  const toggleMenu = useCallback(() => {
    setShowMenu(prev => !prev);
  }, []);

  // 모바일에서 모델 롱프레스 처리
  const handleLongPress = useCallback((modelId: string) => {
    if (isMobile) {
      setShowTerminatePrompt(modelId);
    }
  }, [isMobile]);

  // 모드 변경 함수들
  const editPersona = useCallback(() => setMode(ModeValues.Manage), [setMode]);
  const onBack = useCallback(() => setMode(ModeValues.Import), [setMode]);

  // 관리 모드일 경우 뒤로가기 버튼 활성화
  const activateBackButton = useMemo(() => {
    return mode === ModeValues.Manage || mode === ModeValues.Create;
  }, [mode]);

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
      {activateBackButton && (
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Chat</span>
        </button>
      )}

      <div className="flex items-center space-x-4">
        <button
          className="md:hidden"
          onClick={toggleSidebar}
          data-tour="sidebar-toggle"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>

        {/* 활성 모델 목록 (프로필 원 형태) */}
        <div className="flex -space-x-2">
          {activeModels.map((model) => (
            <div
              key={model.id}
              className="relative"
              onMouseEnter={() => setHoveredModel(model.id)}
              onMouseLeave={() => setHoveredModel(null)}
              onTouchStart={() => {
                const timer = setTimeout(() => handleLongPress(model.id), 800);
                return () => clearTimeout(timer);
              }}
            >
              <div
                className="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center border-2 cursor-pointer relative"
              >
                {model.name.charAt(0)}
                {/* 데스크탑: 마우스 오버시 툴팁 & 삭제 버튼 */}
                {hoveredModel === model.id && (
                  <>
                    <div className="absolute z-10 w-48 bg-white rounded-md shadow-lg top-12 left-0 p-2 text-sm">
                      <p className="font-bold">{model.name}</p>
                      <p className="text-gray-600 text-xs">{model.description}</p>
                    </div>
                    {!isMobile && (
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
                  </>
                )}
                {/* 모바일: 롱프레스 시 삭제 프롬프트 */}
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

      {/* 오른쪽 영역: 시스템 리소스 & 메뉴 */}
      <div className="flex items-center space-x-4">
        {/* RAM 사용량 */}
        <div
          className="relative"
          onMouseEnter={() => setShowResourceInfo('ram')}
          onMouseLeave={() => setShowResourceInfo(null)}
        >
          {resources && (
            <div className="flex items-center space-x-1">
              <Cpu className={`h-5 w-5 ${resources.ram.percentage > 80 ? 'text-red-500' : 'text-gray-600'}`} />
              {!isMobile && (
                <span className="text-xs font-medium">
                  {resources.ram.used}/{resources.ram.total}
                </span>
              )}
            </div>
          )}
          {resources && showResourceInfo === 'ram' && (
            <div className="absolute z-10 w-48 bg-white rounded-md shadow-lg -bottom-24 right-0 p-2 text-sm">
              <p className="font-bold">RAM Usage</p>
              <div className="mt-1 bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${resources.ram.percentage > 90
                    ? 'bg-red-600'
                    : resources.ram.percentage > 75
                      ? 'bg-orange-500'
                      : 'bg-blue-500'
                    }`}
                  style={{ width: `${resources.ram.percentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs">{resources.ram.percentage.toFixed(1)}% used</span>
                <span className="text-xs">
                  {resources.ram.used} of {resources.ram.total}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* VRAM 사용량 */}
        <div
          className="relative"
          onMouseEnter={() => setShowResourceInfo('vram')}
          onMouseLeave={() => setShowResourceInfo(null)}
        >
          {resources && (
            <div className="flex items-center space-x-1">
              <HardDrive className={`h-5 w-5 ${resources.vram.percentage > 80 ? 'text-red-500' : 'text-gray-600'}`} />
              {!isMobile && (
                <span className="text-xs font-medium">
                  {resources.vram.used}/{resources.vram.total}
                </span>
              )}
            </div>
          )}
          {resources && showResourceInfo === 'vram' && (
            <div className="absolute z-10 w-48 bg-white rounded-md shadow-lg -bottom-24 right-0 p-2 text-sm">
              <p className="font-bold">VRAM Usage</p>
              <div className="mt-1 bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${resources.vram.percentage > 90
                    ? 'bg-red-600'
                    : resources.vram.percentage > 75
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                    }`}
                  style={{ width: `${resources.vram.percentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs">{resources.vram.percentage.toFixed(1)}% used</span>
                <span className="text-xs">
                  {resources.vram.used} of {resources.vram.total}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 메뉴 버튼 */}
        <div className="relative">
          <button onClick={toggleMenu}>
            <MoreVertical className="h-6 w-6 text-gray-600" />
          </button>
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
