import { Check, Loader2 } from "lucide-react";
import React from "react";

interface Contents {
  title: string;
  subTitle?: string;
  successTitle?: string;
  subSuccessTitle?: string;
}

const LoadingModal = ({
  isOpen,
  isComplete,
  contents,
}: {
  isOpen: boolean;
  isComplete: boolean;
  contents: Contents;
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
            <h3 className="text-lg font-medium text-gray-900">{contents.successTitle}</h3>
            <p className="text-sm text-gray-500 mt-2">{contents.subSuccessTitle}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative">
              <Loader2
                className="animate-spin text-blue-500"
                size={48}
                strokeWidth={2.5}
              />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mt-6">{contents.title}</h3>
            <p className="text-sm text-gray-500 mt-2">{contents.subTitle}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(LoadingModal);