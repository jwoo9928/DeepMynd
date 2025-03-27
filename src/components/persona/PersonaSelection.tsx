import { useEffect, useMemo } from "react";
import { Persona } from "../../controllers/types";

const PersonaSelection = ({
  personas,
  handlePersonaSelection
}: {
  personas: Persona[];
  handlePersonaSelection: (persona: Persona) => void
}) => {

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

  const handlePersonaClick = (persona: Persona) => {
    handlePersonaSelection(persona);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {personas.map(persona => (
        <div
          key={persona.id}
          className="bg-gray-100 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handlePersonaClick(persona)}
        >
          <div className="relative">
            <img
              src={URL.createObjectURL(persona.avatar)}
              alt={persona.name}
              className="w-full h-64 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <h3 className="text-xl font-semibold text-white">{persona.name}</h3>
              <div className="flex space-x-2 mt-2">
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">NEW</span>
                {persona.tags?.map(tag => (
                  <span
                    key={tag}
                    className="bg-gray-700/50 text-white text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-100">
            <p className="text-sm text-gray-600 line-clamp-2">{persona.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PersonaSelection;