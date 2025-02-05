import { Menu, MoreVertical } from "lucide-react";
import React from "react";

const ChatHeader = ({ toggleSidebar }: {
    toggleSidebar: () => void;
}) => (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-4">
            <button className="md:hidden" onClick={toggleSidebar}>
                <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <h2 className="font-medium">Current Chat</h2>
            </div>
        </div>
        <button>
            <MoreVertical className="h-6 w-6 text-gray-600" />
        </button>
    </div>
);

export default React.memo(ChatHeader);