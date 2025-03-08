import React, { useRef } from "react";
import { Paperclip, Pause, Send } from "lucide-react";
import { ChatController } from "../../../controllers/ChatController";

interface ChatInputProps {
	inputValue: string;
	setInputValue: (value: string) => void;
	handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	handleSendMessage: () => void;
	isGenerating: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
	inputValue,
	setInputValue,
	handleKeyPress,
	handleSendMessage,
	isGenerating,
}) => {
	const chatController = useRef(ChatController.getInstance());
	return (
		<div className="bg-white border-t border-gray-200 p-4 space-y-2">
			{/* 입력창과 버튼들 */}
			<div className="flex items-center space-x-2">
				<input
					data-tour="chat-input"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyPress={handleKeyPress}
					type="text"
					placeholder="Type a message..."
					className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none"
				/>

				<button
					data-tour="persona-select"
					className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors duration-200"
				>
					<Paperclip className="h-4 w-4" />
				</button>

				{isGenerating ? (
					<button
						className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
						onClick={() => chatController.current?.stopGeneration()}
					>
						<Pause className="h-5 w-5" />
					</button>
				) : (
					<button
						className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
						onClick={handleSendMessage}
						disabled={!inputValue.trim()}
					>
						<Send className="h-5 w-5" />
					</button>
				)}
			</div>
		</div>
	);
};

export default React.memo(ChatInput, (prevProps, nextProps) => {
	return (
		prevProps.inputValue === nextProps.inputValue &&
		prevProps.isGenerating === nextProps.isGenerating &&
		prevProps.handleSendMessage === nextProps.handleSendMessage &&
		prevProps.handleKeyPress === nextProps.handleKeyPress
	);
});