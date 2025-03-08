import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface TourStep {
    target: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
    {
        target: '[data-tour="sidebar-toggle"]',
        content: 'Access your chat history and start new conversations here',
        position: 'right'
    },
    {
        target: '[data-tour="chat-input"]',
        content: 'Type your messages here to chat with your AI assistant',
        position: 'top'
    },
    {
        target: '[data-tour="persona-select"]',
        content: 'Create or select different AI personas to chat with',
        position: 'left'
    }
];

interface OnboardingTourProps {
    isOpen: boolean;
    onClose: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!isOpen) return;

        const positionTooltip = () => {
            const target = document.querySelector(tourSteps[currentStep].target);
            if (!target) return;

            const rect = target.getBoundingClientRect();
            const position = tourSteps[currentStep].position;

            let top = 0;
            let left = 0;

            switch (position) {
                case 'top':
                    top = rect.top - 80;
                    left = rect.left + (rect.width / 2) - 150;
                    break;
                case 'bottom':
                    top = rect.bottom + 10;
                    left = rect.left + (rect.width / 2) - 150;
                    break;
                case 'left':
                    top = rect.top + (rect.height / 2) - 40;
                    left = rect.left - 310;
                    break;
                case 'right':
                    top = rect.top + (rect.height / 2) - 40;
                    left = rect.right + 10;
                    break;
            }

            setTooltipPosition({ top, left });
        };

        positionTooltip();
        window.addEventListener('resize', positionTooltip);
        return () => window.removeEventListener('resize', positionTooltip);
    }, [currentStep, isOpen]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep === tourSteps.length - 1) {
            onClose();
            setCurrentStep(0);
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
            <div
                className="fixed z-50 w-[300px] bg-white rounded-lg shadow-xl p-4"
                style={{
                    top: tooltipPosition.top,
                    left: tooltipPosition.left,
                }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                    <X size={16} />
                </button>
                <div className="mb-4">
                    <p className="text-sm text-gray-600">{tourSteps[currentStep].content}</p>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex space-x-1">
                        {tourSteps.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full ${index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={handleNext}
                        className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                    >
                        {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default OnboardingTour; 