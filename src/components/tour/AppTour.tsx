import React from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

interface AppTourProps {
    isOpen: boolean;
    onClose: () => void;
}

const steps: Step[] = [
    {
        target: '[data-tour="chat-input"]',
        content: 'Type your messages here to chat with your AI assistant',
        placement: 'top',
        disableBeacon: true,
    },
    {
        target: '[data-tour="persona-select"]',
        content: 'Create or select different AI personas to chat with',
        placement: 'left',
    },
    {
        target: '[data-tour="sidebar-toggle"]',
        content: 'Access your chat history and start new conversations here',
        placement: 'right',
    }
];

const AppTour: React.FC<AppTourProps> = ({ onClose }) => {
    const handleCallback = (data: CallBackProps) => {
        const { status } = data;
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            onClose();
        }
    };

    return (
        <Joyride
            callback={handleCallback}
            continuous
            hideCloseButton
            hideBackButton
            showProgress
            showSkipButton
            run={true}
            steps={steps}
            styles={{
                options: {
                    primaryColor: '#3B82F6',
                    zIndex: 1000,
                },
                tooltipContainer: {
                    textAlign: 'left',
                },
                buttonNext: {
                    backgroundColor: '#3B82F6',
                },
                buttonBack: {
                    marginRight: 10,
                },
            }}
        />
    );
};

export default AppTour; 