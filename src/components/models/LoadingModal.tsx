import { Check } from "lucide-react";
import React from "react";

const LoadingModal = ({
  isOpen,
  isComplete
}: {
  isOpen: boolean;
  isComplete: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-sm mx-4">
        {isComplete ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Persona Created!</h3>
            <p className="text-sm text-gray-500 mt-2">Your new persona is ready to use</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Outer spinning ring */}
              <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-spin">
                {/* Blue arc */}
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin-fast"
                  style={{
                    clip: 'rect(0, 32px, 64px, 0)',
                    animationDuration: '0.6s'
                  }}
                />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mt-6">Creating Persona...</h3>
            <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(LoadingModal);