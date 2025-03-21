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
    const { content } = message;

    // Handle image content
    if (content.startsWith('/image:')) {
        return <ImageContent imageData={content.replace('/image:', '')} />;
    }

    // User messages are simple markdown
    if (isUserMessage) {
        return <ReactMarkdown>{content}</ReactMarkdown>;
    }

    // Assistant messages may contain thinking content
    return <ThinkingContent content={content} isGenerating={isGenerating} />;
};

export default React.memo(MessageContent);