import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface ImageContentProps {
    imageData: string;
}

const ImageContent: React.FC<ImageContentProps> = ({ imageData }) => {
    const [isImageLoading, setIsImageLoading] = useState(true);

    return (
        <div className="relative">
            {isImageLoading && (
                <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
            )}
            <img
                src={imageData}
                alt="Generated content"
                className={`max-w-full rounded-lg transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                onLoad={() => setIsImageLoading(false)}
            />
        </div>
    );
};

export default React.memo(ImageContent);