import React, { useState } from 'react';
import { Menu, X, Send, MoreVertical, Search } from 'lucide-react';

const ChatLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="h-screen w-full bg-gray-100">
      {/* Main Container */}
      <div className="flex h-full">
        {/* Sidebar - Hidden on mobile by default */}
        <div
          className={`
            fixed md:relative
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            w-80 h-full bg-white border-r border-gray-200
            transition-transform duration-300 ease-in-out z-20
          `}
        >
          {/* Sidebar Header */}
          <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
            <h1 className="text-xl font-semibold">Messages</h1>
            <button className="md:hidden" onClick={toggleSidebar}>
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* Search Bar */}
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

          {/* Chat List */}
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

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full">
          {/* Chat Header */}
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

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] p-3 rounded-2xl ${
                    i % 2 === 0
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p>This is a sample message {i}</p>
                  <span className="text-xs mt-1 block opacity-70">12:3{i} PM</span>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none"
              />
              <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default ChatLayout;