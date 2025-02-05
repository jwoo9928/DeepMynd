import { Search, X } from "lucide-react";
import React from "react";

const Sidebar = ({ isOpen, toggleSidebar }: {
    isOpen: boolean;
    toggleSidebar: () => void;
}) => (
    <>
        <div
            className={`
        fixed md:relative
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        w-80 h-full bg-white border-r border-gray-200
        transition-transform duration-300 ease-in-out z-20
      `}
        >
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
                <h1 className="text-xl font-semibold">Messages</h1>
                <button className="md:hidden" onClick={toggleSidebar}>
                    <X className="h-6 w-6 text-gray-600" />
                </button>
            </div>

            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search messages"
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full outline-none"
                    />
                </div>
            </div>

            <div className="overflow-y-auto h-[calc(100%-8rem)]">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-medium">User {i}</h3>
                                    <span className="text-xs text-gray-500">12:30 PM</span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">Latest message preview...</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        {isOpen && (
            <div
                className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
                onClick={toggleSidebar}
            />
        )}
    </>
);

export default React.memo(Sidebar);