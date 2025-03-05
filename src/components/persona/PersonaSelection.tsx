import { useEffect, useState } from "react";
import { Persona } from "../../controllers/types";
import { PersonaController } from "../../controllers/PersonaController";
import { EVENT_TYPES, eventEmitter } from "../../controllers/events";

// const personaList: any[] = [
//   {
//     id: "p1",
//     name: "Assistant",
//     avatar: "/assets/assistant-avatar.png",
//     description: "General purpose AI assistant that can help with various tasks",
//     model: "GPT-4",
//     features: ["General knowledge", "Creative writing", "Coding assistance", "Learning support"],
//     color: "#FF9F7F" // Soft coral
//   },
//   {
//     id: "p2",
//     name: "Code Expert",
//     avatar: "/assets/coder-avatar.png",
//     description: "Specialized in helping with programming and development tasks",
//     model: "Claude-3",
//     features: ["Code completion", "Debugging", "Code review", "Technical explanations"],
//     color: "#7FAEFF" // Soft blue
//   },
//   {
//     id: "p3",
//     name: "Academic",
//     avatar: "/assets/academic-avatar.png",
//     description: "Perfect for students and researchers seeking help with academic content",
//     model: "GPT-4 Turbo",
//     features: ["Research assistance", "Paper writing", "Citation help", "Summarization"],
//     color: "#9F7FFF" // Soft purple
//   },
//   {
//     id: "p4",
//     name: "Creative Partner",
//     avatar: "/assets/creative-avatar.png",
//     description: "Helps with creative projects and artistic endeavors",
//     model: "Claude-3 Opus",
//     features: ["Storytelling", "Poetry", "Idea generation", "Content creation"],
//     color: "#FF7FD5" // Soft pink
//   },
//   {
//     id: "p5",
//     name: "Business Advisor",
//     avatar: "/assets/business-avatar.png",
//     description: "Assists with business strategy, marketing, and professional communications",
//     model: "GPT-4o",
//     features: ["Business planning", "Marketing strategy", "Professional writing", "Data analysis"],
//     color: "#7FD5FF" // Soft sky blue
//   },
//   {
//     id: "p6",
//     name: "Language Tutor",
//     avatar: "/assets/language-avatar.png",
//     description: "Helps learn new languages and improve language skills",
//     model: "Gemini Pro",
//     features: ["Language learning", "Grammar correction", "Vocabulary building", "Conversation practice"],
//     color: "#7FFFB0" // Soft mint
//   }
// ];

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
            // style={{ borderColor: persona.color }}
            onClick={() => {
              handlePersonaSelection(persona);
            }}
          >
            <div className="p-4">
              <div className="flex flex-col items-center mb-3">
                <div
                  className="w-16 h-16 rounded-full overflow-hidden mb-3 border-4"
                // style={{ borderColor: persona.color }}
                >
                  <img src={persona.avatar} alt={persona.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-lg mb-1">{persona.name}</h3>
                <div className="text-xs px-2 py-1 rounded-full">
                  {/* <div className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${persona.color}33` }}> */}
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