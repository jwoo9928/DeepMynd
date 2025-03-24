import React, { useRef, useState, useEffect } from "react";
import { Paperclip, Pause, Send, Globe, Loader2 } from "lucide-react";
import { ChatController } from "../../../controllers/ChatController";
import { useAtom } from "jotai";
import { isActivateTranslator } from "../../../stores/ui.store";
import { LLMController } from "../../../controllers/LLMController";

interface ChatInputProps {
	inputValue: string;
	setInputValue: (value: string) => void;
	handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	handleSendMessage: () => void;
	isGenerating: boolean;
	currentModel?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
	inputValue,
	setInputValue,
	handleKeyPress,
	handleSendMessage,
	isGenerating,
	currentModel = "Claude 3.7 Sonnet",
}) => {
	const chatController = useRef(ChatController.getInstance());
	const [translationEnabled, setTranslationEnabled] = useAtom(isActivateTranslator);
	const [isTranslationLoading, setIsTranslationLoading] = useState(false);

	const toggleTranslation = () => {
		if (!translationEnabled) {
			setIsTranslationLoading(true);
			// Simulate loading time for translation engine
			setTimeout(() => {
				setIsTranslationLoading(false);
				setTranslationEnabled(true);
			}, 2000); // Adjust timing as needed
		} else {
			setTranslationEnabled(false);
		}
	};

	// Optional: Cleanup timeout if component unmounts during loading
	useEffect(() => {
		return () => {
			if (isTranslationLoading) {
				setIsTranslationLoading(false);
			}
		};
	}, []);

	useEffect(() => {
		LLMController.getInstance().toggleTranslator(translationEnabled);
	}, [translationEnabled])

	return (
		<div className="bg-white border-t border-gray-200 p-4 space-y-2">
			{/* Model info and AI translation toggle */}
			<div className="flex items-center justify-between mb-2 px-2">
				<div className="text-sm text-gray-500 flex items-center">
					<div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
					{currentModel}
				</div>

				<button
					onClick={toggleTranslation}
					disabled={isTranslationLoading}
					className={`flex items-center text-sm px-3 py-1 rounded-full transition-colors duration-200 ${isTranslationLoading
						? "bg-blue-50 text-blue-400 cursor-not-allowed"
						: translationEnabled
							? "bg-blue-100 text-blue-600"
							: "bg-gray-100 text-gray-500 hover:bg-gray-200"
						}`}
				>
					{isTranslationLoading ? (
						<>
							<Loader2 className="h-3 w-3 mr-1 animate-spin" />
							<span>Loading...</span>
						</>
					) : (
						<>
							<Globe className="h-3 w-3 mr-1" />
							<span>{translationEnabled ? "Translation ON" : "Translation OFF"}</span>
						</>
					)}
				</button>
			</div>

			{/* Input field and buttons */}
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
		prevProps.handleKeyPress === nextProps.handleKeyPress &&
		prevProps.currentModel === nextProps.currentModel
	);
});