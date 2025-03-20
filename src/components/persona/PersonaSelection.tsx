import { useEffect, useState, useMemo } from "react";
import { Persona } from "../../controllers/types";
import { PersonaController } from "../../controllers/PersonaController";
import { EVENT_TYPES, eventEmitter } from "../../controllers/events";
import LoginPrompt from '../auth/LoginPrompt';

const PersonaSelection = ({
  handlePersonaSelection
}: {
  handlePersonaSelection: (persona: Persona) => void
}) => {
  const personaController = PersonaController.getInstance();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Avatar URL 캐싱을 위한 메모이제이션
  const avatarUrls = useMemo(() => {
    const urls: Record<string, string> = {};
    personas.forEach(persona => {
      urls[persona.id] = URL.createObjectURL(persona.avatar);
    });
    return urls;
  }, [personas]);

  // 컴포넌트 언마운트 시 URL 객체 정리
  useEffect(() => {
    return () => {
      Object.values(avatarUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [avatarUrls]);

  useEffect(() => {
    let pList = personaController.getPersonaList();
    if (pList.length > 0) {
      setPersonas(Array.from(pList.values()));
    }

    const handlePersonaList = (personaList: Map<string, Persona>) => {
      console.log("personaList", personaList);
      setPersonas(Array.from(personaList.values()));
    }

    eventEmitter.on(EVENT_TYPES.IMPORTED_PERSONA, handlePersonaList);

    return () => {
      eventEmitter.off(EVENT_TYPES.IMPORTED_PERSONA, handlePersonaList);
    };
  }, []);

  const handlePersonaClick = (persona: Persona) => {
    // if (!isLoggedIn) {
    //   setShowLoginPrompt(true);
    //   return;
    // }
    handlePersonaSelection(persona);
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Choose Your AI Friend</h2>

      {/* 순수하게 Tailwind의 반응형 클래스만 사용 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {personas.map(persona => (
          <div
            key={persona.id}
            className="border-2 rounded-xl overflow-hidden transition-all duration-300
            hover:shadow-lg hover:transform hover:scale-105 cursor-pointer
            bg-white border-opacity-50"
            onClick={() => {
              handlePersonaClick(persona);
            }}
          >
            <div className="flex flex-col h-full">
              <div className="relative">
                <img
                  src={URL.createObjectURL(persona.avatar)}
                  alt={persona.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="text-xl font-semibold text-white truncate">{persona.name}</h3>
                  <p className="text-sm text-gray-200 truncate">{persona.producer}</p>
                </div>
              </div>

              {/* 태그 컨테이너에 flex-wrap 추가하고 정렬 개선 */}
              {/* <div className="flex flex-wrap gap-2 justify-center p-3 mt-1">
                {persona.tags?.map(tag => (
                  <span
                    key={tag}
                    className="inline-block px-3 py-1 text-xs font-medium rounded-full text-white shadow-sm transition-all"
                    style={{ 
                      backgroundColor: persona.color || '#4B5563',
                      opacity: 0.85
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PersonaSelection