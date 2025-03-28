import { Persona } from "../../controllers/types";
import { useState, useRef, useEffect } from "react";
import PersonaSelection from "./PersonaSelection";
import PersonaModal from "./PersonaModal";
import { EVENT_TYPES, eventEmitter } from "../../controllers/utils/events";
import { ChatController } from "../../controllers/ChatController";
import { Search, Filter, ChevronDown } from "lucide-react";
import { PersonaController } from "../../controllers/PersonaController";

const PersonaLayout = () => {
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
    const [showPersonaModal, setShowPersonaModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortOption, setSortOption] = useState<string>("latest");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

    const [personas, setPersonas] = useState<Persona[]>([]);

    const [allTags,] = useState<string[]>([]);

    const chatController = useRef(ChatController.getInstance());
    const personaController = useRef(PersonaController.getInstance());

    const handlePersonaSelection = (persona: Persona) => {
        setSelectedPersona(persona);
        setShowPersonaModal(true);
    };

    useEffect(() => {
        let pList = personaController.current.getPersonaList();
        if (pList.length > 0) {
            setPersonas(Array.from(pList.values()));
        }

        const handlePersonaList = (personaList: Map<string, Persona>) => {
            setPersonas(Array.from(personaList.values()));
        }

        eventEmitter.on(EVENT_TYPES.IMPORTED_PERSONA, handlePersonaList);

        return () => {
            eventEmitter.off(EVENT_TYPES.IMPORTED_PERSONA, handlePersonaList);
        };
    }, []);

    useEffect(() => {
        if (searchTerm === "" && selectedTags.length === 0) {
            setPersonas(personaController.current.getPersonaList());
        } else {
            setPersonas(personas => {
                let filteredPersonas = personas.filter(persona =>
                    persona.name.toLowerCase().includes(searchTerm.toLowerCase() ?? '') ||
                    (persona.tags && persona.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase() ?? ''))) ||
                    persona.description?.toLowerCase().includes(searchTerm.toLowerCase() ?? '')
                );
                if (selectedTags.length > 0) {
                    filteredPersonas = filteredPersonas.filter(persona =>
                        persona.tags?.some(tag => selectedTags.includes(tag))
                    );
                }
                return filteredPersonas;
            })
        }
    }, [searchTerm, selectedTags]);

    // Start chat with selected persona
    const startChat = async (model_id?: string, qType?: string) => {
        if (selectedPersona) {
            let persona: Persona = {
                ...selectedPersona,
                model_id: model_id || selectedPersona.model_id,
                q_type: qType || selectedPersona.q_type
            }
            if (selectedPersona) {
                console.log("start chat id", persona.model_id);
                eventEmitter.emit(EVENT_TYPES.MODEL_INITIALIZING, persona.model_id, persona.q_type);
                setShowPersonaModal(false);
                await chatController.current.createChatRoom(persona);
            }
        }
    };

    // Collect unique tags from personas
    // const collectTags = (personas: Persona[]) => {
    //     const tagSet = new Set<string>();
    //     personas.forEach(persona =>
    //         persona.tags?.forEach(tag => tagSet.add(tag))
    //     );
    //     return Array.from(tagSet);
    // };

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4">
                <header className="py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">AI 친구 선택</h1>
                    <div className="flex space-x-2">
                        {/* <button className="bg-blue-500 text-white px-4 py-2 rounded">
                            닉네임 설정
                        </button>
                        <button className="bg-green-500 text-white px-4 py-2 rounded">
                            봇 생성하기
                        </button> */}
                    </div>
                </header>

                {/* Search and Filter Section */}
                <div className="mb-6 flex items-center space-x-4">
                    {/* Search Input */}
                    <div className="flex-grow relative">
                        <input
                            type="text"
                            placeholder="AI 친구 검색하기"
                            className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>

                    {/* Filter Button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="p-2 border rounded-lg hover:bg-gray-100 flex items-center"
                        >
                            <Filter size={20} />
                            {selectedTags.length > 0 && (
                                <span className="ml-2 text-sm text-blue-600">
                                    {selectedTags.length}
                                </span>
                            )}
                        </button>

                        {isFilterOpen && (
                            <div className="absolute z-10 mt-2 w-64 bg-white border rounded-lg shadow-lg p-4">
                                <p className="text-sm font-semibold mb-2">필터 선택</p>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleTagToggle(tag)}
                                            className={`px-3 py-1 rounded-full text-xs transition-colors ${selectedTags.includes(tag)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-100"
                        >
                            {sortOption === "latest" ? "최신순" :
                                sortOption === "trending" ? "트렌딩" : "인기순"}
                            <ChevronDown size={20} className="ml-2" />
                        </button>

                        {isSortDropdownOpen && (
                            <div className="absolute z-10 mt-2 w-32 bg-white border rounded-lg shadow-lg">
                                <ul>
                                    <li
                                        onClick={() => {
                                            setSortOption("latest");
                                            setIsSortDropdownOpen(false);
                                        }}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        최신순
                                    </li>
                                    <li
                                        onClick={() => {
                                            setSortOption("trending");
                                            setIsSortDropdownOpen(false);
                                        }}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        트렌딩
                                    </li>
                                    <li
                                        onClick={() => {
                                            setSortOption("popular");
                                            setIsSortDropdownOpen(false);
                                        }}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        인기순
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <PersonaSelection
                    personas={personas}
                    handlePersonaSelection={handlePersonaSelection}
                />

                <PersonaModal
                    setShowPersonaModal={setShowPersonaModal}
                    selectedPersona={selectedPersona}
                    showPersonaModal={showPersonaModal}
                    startChat={startChat}
                />
            </div>
        </div>
    );
}

export default PersonaLayout;