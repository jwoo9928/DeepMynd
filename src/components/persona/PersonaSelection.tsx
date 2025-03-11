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
            style={{ borderColor: persona.color }}
            onClick={() => {
              handlePersonaClick(persona);
            }}
          >
            <div className="pb-4">
              <img
                src={URL.createObjectURL(persona.avatar)}
                alt={persona.name}
                className="w-full h-48 object-cover"
              />
              <div className="flex flex-col items-center mb-3">

                <h3 className="font-bold text-lg mb-1">{persona.name}</h3>
                <div className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${persona.color}33` }}>
                  {persona.producer}
                </div>
              </div>
              <p className="text-gray-600 text-sm text-center truncate pl-4 pr-4">{persona.description}</p>
            </div>
          </div>
        ))}
      </div>
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="Log in to change or create new Personas! Unlock the full potential of UniMynd with a personalized experience."
      />
    </div>
  );
}

export default PersonaSelection