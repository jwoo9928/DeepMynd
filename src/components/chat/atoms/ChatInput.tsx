import React, { useRef, useState } from "react";
import { Paperclip, Pause, Send, Globe } from "lucide-react";
import { ChatController } from "../../../controllers/ChatController";
import { useAtom, useAtomValue } from "jotai";
import { isActivateTranslator } from "../../../stores/ui.store";
import { activateTranslateLanguageAtom } from "../../../stores/data.store";
import Languages from "./Languages";

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
	const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
	const activatedLanguage = useAtomValue(activateTranslateLanguageAtom);

	const toggleTranslation = () => {
		setTranslationEnabled(!translationEnabled);
	};

	return (
		<div className="bg-white border-t border-gray-200 p-4 space-y-2">
			{/* Model info and AI translation features */}
			<div className="flex items-center justify-between mb-2 px-2">
				<div className="text-sm text-gray-500 flex items-center">
					<div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
					{currentModel}
				</div>
				<div className="flex items-center space-x-2">
					{/* Translation Toggle with Label */}
					<div className="flex items-center">
						<span className="text-xs text-gray-500 mr-2">Translate</span>
						<div
							onClick={toggleTranslation}
							className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors duration-200 ${translationEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
						>
							<div
								className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${translationEnabled ? 'translate-x-5' : ''}`}
							/>
						</div>
					</div>

					{/* Language Selection Button - Compact */}
					<button
						onClick={() => setIsLanguageModalOpen(true)}
						className={`flex items-center text-xs px-2 py-1 rounded-md border transition-colors ${activatedLanguage
							? 'border-blue-300 bg-blue-50 text-blue-600'
							: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
							}`}
					>
						<Globe className="h-3 w-3 mr-1" />
						{activatedLanguage ? activatedLanguage.language : 'Lang'}
					</button>
				</div>
			</div>

			{/* Input field and buttons */}
			<div className="flex items-center space-x-2">
				<input
					data-tour="chat-input"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={handleKeyPress}
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

			<Languages
				isLanguageModalOpen={isLanguageModalOpen}
				setIsLanguageModalOpen={setIsLanguageModalOpen}
			/>
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