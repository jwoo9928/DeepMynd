import React from "react";
import { Message } from "../../../../controllers/types";
import ReactMarkdown from "react-markdown";
import ImageContent from "./ImageContent";
import ThinkingContent from "./ThinkingContent";

interface MessageContentProps {
    message: Message;
    isGenerating: boolean;
    isUserMessage: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({
    message,
    isGenerating,
    isUserMessage
}) => {
    const { content, role } = message;

    // Handle image content
    if (content.startsWith('/image:')) {
        return <ImageContent imageData={content.replace('/image:', '')} />;
    }

    // Use appropriate rendering for different message types
    if (role === 'ts' || role === 'origin' || isUserMessage) {
        return <ReactMarkdown>{content}</ReactMarkdown>;
    }

    // Assistant messages may contain thinking content
    return <ThinkingContent content={content} isGenerating={isGenerating} />;
};

export default React.memo(MessageContent, (prevProps, nextProps) => {
    return (
        prevProps.message.content === nextProps.message.content &&
        prevProps.message.role === nextProps.message.role &&
        prevProps.isGenerating === nextProps.isGenerating &&
        prevProps.isUserMessage === nextProps.isUserMessage
    );
});