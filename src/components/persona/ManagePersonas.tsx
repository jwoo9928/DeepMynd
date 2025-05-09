import { useState, useEffect, useMemo } from "react";
import { Persona } from "../../controllers/types";
import { PersonaController } from "../../controllers/PersonaController";
import { EVENT_TYPES, eventEmitter } from "../../controllers/utils/events";

const ManagePersonas = () => {
    const personaController = PersonaController.getInstance();
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [selectedPersonas, setSelectedPersonas] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Avatar URL 캐싱을 위한 메모이제이션
    const avatarUrls = useMemo(() => {
        const urls: Record<string, string> = {};
        personas.forEach(persona => {
            if (persona.avatar instanceof Blob) {
                urls[persona.id] = URL.createObjectURL(persona.avatar);
            }
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
            setPersonas(Array.from(personaList.values()));
        };

        eventEmitter.on(EVENT_TYPES.IMPORTED_PERSONA, handlePersonaList);

        return () => {
            eventEmitter.off(EVENT_TYPES.IMPORTED_PERSONA, handlePersonaList);
        };
    }, []);

    const handlePersonaClick = (persona: Persona) => {
        togglePersonaSelection(persona.id);
    };

    const togglePersonaSelection = (personaId: string) => {
        setSelectedPersonas(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(personaId)) {
                newSelection.delete(personaId);
            } else {
                newSelection.add(personaId);
            }
            return newSelection;
        });
    };

    const handleDeleteClick = (e: React.MouseEvent, personaId: string) => {
        e.stopPropagation(); // Prevent triggering persona click
        setShowDeleteConfirm(personaId);
    };

    const confirmDelete = (personaId: string) => {
        // Implement delete functionality
        console.log("Deleting persona:", personaId);
        // personaController.deletePersona(personaId);

        // Remove from selected personas
        setSelectedPersonas(prev => {
            const newSelection = new Set(prev);
            newSelection.delete(personaId);
            return newSelection;
        });

        setShowDeleteConfirm(null);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(null);
    };

    const clearSelection = () => {
        setSelectedPersonas(new Set());
    };

    const handleUploadSelected = () => {
        console.log("Uploading selected personas:", Array.from(selectedPersonas));
        // Implement your upload functionality here
    };

    return (
        <div className="p-4 md:p-6 relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-center flex-grow">Choose Persona to upload</h2>
                {selectedPersonas.size > 0 && (
                    <button
                        onClick={clearSelection}
                        className="text-blue-500 font-medium"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-20">
                {personas.map(persona => (
                    <div
                        key={persona.id}
                        className={`border-2 rounded-xl overflow-hidden transition-all duration-300
            ${selectedPersonas.has(persona.id) ? 'border-blue-500 shadow-md' : 'border-opacity-50'}
            hover:shadow-lg cursor-pointer bg-white relative`}
                        onClick={() => handlePersonaClick(persona)}
                    >
                        <div className="flex flex-col h-full">
                            <button
                                className="absolute top-2 right-2 z-10 bg-gray-800 bg-opacity-70 text-white rounded-full w-8 h-8 flex items-center justify-center"
                                onClick={(e) => handleDeleteClick(e, persona.id)}
                            >
                                ✕
                            </button>

                            <div className="relative">
                                <img
                                    src={avatarUrls[persona.id] || '/default-avatar.png'}
                                    alt={persona.name}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                    <h3 className="text-xl font-semibold text-white truncate">{persona.name}</h3>
                                    <p className="text-sm text-gray-200 truncate">{persona.producer}</p>
                                </div>
                            </div>

                            {selectedPersonas.has(persona.id) && (
                                <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                    ✓
                                </div>
                            )}
                        </div>

                        {showDeleteConfirm === persona.id && (
                            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
                                <div className="bg-white p-4 rounded-lg max-w-xs w-full">
                                    <p className="mb-4 text-center">Are you sure you want to delete this persona?</p>
                                    <div className="flex justify-center space-x-4">
                                        <button
                                            className="px-4 py-2 bg-red-500 text-white rounded"
                                            onClick={() => confirmDelete(persona.id)}
                                        >
                                            Delete
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-gray-300 rounded"
                                            onClick={cancelDelete}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Upload button at the bottom of the component (not fixed to the viewport) */}
            {selectedPersonas.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 flex justify-center">
                    <button
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold"
                        onClick={handleUploadSelected}
                    >
                        Upload {selectedPersonas.size} Selected
                    </button>
                </div>
            )}
        </div>
    );
};

export default ManagePersonas;