import { ChevronDownIcon } from "lucide-react";
import React, { useState } from "react";

const CustomDropdown = ({
  options,
  selectedValue,
  onSelect
}: {
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between 
             border border-gray-300 rounded-full 
             px-2 py-1 text-xs cursor-pointer 
             hover:bg-gray-50 transition-all"
      >
        <span>{selectedValue}</span>
        <ChevronDownIcon
          className={`h-4 w-4 ml-2 transition-transform 
            ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
      {isOpen && (
        <ul
          className="absolute z-10 top-full left-0 mt-1 
                       border border-gray-300 rounded-md 
                       bg-white shadow-lg overflow-hidden 
                       min-w-full"
        >
          {options.map((option) => (
            <li
              key={option}
              onClick={() => {
                onSelect(option);
                setIsOpen(false);
              }}
              className="px-3 py-2 hover:bg-gray-100 
                           cursor-pointer text-sm 
                           transition-colors"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown