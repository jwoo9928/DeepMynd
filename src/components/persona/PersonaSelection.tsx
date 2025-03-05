import { useEffect, useState } from "react";
import { Persona } from "../../controllers/types";
import { PersonaController } from "../../controllers/PersonaController";
import { EVENT_TYPES, eventEmitter } from "../../controllers/events";

const PersonaSelection = ({
  handlePersonaSelection
}: {
  handlePersonaSelection: (persona: Persona) => void
}) => {
  const personaController = PersonaController.getInstance();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [personas, setPersonas] = useState<Persona[]>([])

  // Check if viewport is mobile size
  useEffect(() => {
    let pList = personaController.getPersonaList();
    if (pList.length > 0) {
      setPersonas(Array.from(pList.values()));
    }
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    const handlePersonaList = (personaList: Map<string, Persona>) => {
      console.log("personaList", personaList)
      setPersonas(Array.from(personaList.values()));
    }

    checkMobile();
    window.addEventListener('resize', checkMobile);
    eventEmitter.on(EVENT_TYPES.IMPORTED_PERSONA, handlePersonaList);

    return () => {
      window.removeEventListener('resize', checkMobile);
      eventEmitter.off(EVENT_TYPES.IMPORTED_PERSONA, handlePersonaList);
    };
  }, []);


  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Choose Your AI Friend</h2>

      {/* Grid for tablets and desktops, list for mobile */}
      <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-2 md:grid-cols-3 gap-6'}`}>
        {personas.map(persona => (
          <div
            key={persona.id}
            className={`
                        border-2 rounded-xl overflow-hidden transition-all duration-300
                        hover:shadow-lg hover:scale-102 cursor-pointer
                        bg-white border-opacity-50
                    `}
            style={{ borderColor: persona.color }}
            onClick={() => {
              handlePersonaSelection(persona);
            }}
          >
            <div className="p-4">
              <div className="flex flex-col items-center mb-3">
                <div
                  className="w-16 h-16 rounded-full overflow-hidden mb-3 border-4"
                  style={{ borderColor: persona.color }}
                >
                  {<img src={URL.createObjectURL(persona.avatar)} alt={persona.name} className="w-full h-full object-cover" />}
                </div>
                <h3 className="font-bold text-lg mb-1">{persona.name}</h3>
                {/* <div className="text-xs px-2 py-1 rounded-full"> */}
                <div className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${persona.color}33` }}>
                  {persona.producer}
                </div>
              </div>
              <p className="text-gray-600 text-sm text-center">{persona.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PersonaSelection