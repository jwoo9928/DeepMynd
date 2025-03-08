import React, { useCallback, useMemo, useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface TourPersonaProps {
  isOpen: boolean;
  onClose: () => void;
}

const TourPersona: React.FC<TourPersonaProps> = ({ isOpen, onClose }) => {
  // Tour steps
  const steps = useMemo((): Step[] => [
    {
      target: '#profile-image',
      content: 'Upload a profile image for your persona. The system will automatically extract a theme color from it.',
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '#model-selection',
      content: 'Select the AI models that will power your persona\'s abilities.',
      placement: 'bottom',
    },
    {
      target: '#persona-details',
      content: 'Give your persona a name and description to help you identify it.',
      placement: 'bottom',
    },
    {
      target: '#special-abilities',
      content: 'Add special ability tags by typing and pressing Enter. Start with # or just type the tag name.',
      placement: 'top',
    },
    {
      target: '#instructions',
      content: 'Define how your persona should behave and respond with detailed instructions.',
      placement: 'top',
    },
    {
      target: '#first-message',
      content: 'Set the first message your persona will send when starting a new conversation.',
      placement: 'top',
    },
  ], []);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, index, type } = data;

    // Scroll to the target element
    if (type === 'step:before') {
      const targetId = steps[index].target.toString().replace('#', '');
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }

    // Handle tour completion
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      onClose();
    }
  }, [steps, onClose]);

  return (
    <Joyride
      steps={steps}
      run={isOpen}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      scrollOffset={100}
      styles={{
        options: {
          primaryColor: '#3B82F6',
          zIndex: 1000,
        },
      }}
      callback={handleJoyrideCallback}
      disableOverlayClose
    />
  );
};

export default TourPersona;