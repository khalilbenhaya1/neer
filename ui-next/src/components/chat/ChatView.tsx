import { useState } from 'react';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { Header } from './Header';
import { Footer } from '../shared/Footer';
import { FileDropZone } from '../upload/FileDropZone';
import { AttachmentPreview } from './AttachmentPreview';

export function ChatView() {
    const [messages, setMessages] = useState<Array<{
        id: string;
        role: 'user' | 'assistant';
        content: string;
        timestamp: Date;
    }>>([]);

    const [isStreaming, setIsStreaming] = useState(false);

    const handleSendMessage = async (content: string) => {
        // Add user message
        const userMessage = {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsStreaming(true);

        try {
            // TODO: Call /api/run endpoint
            // For now, add a mock AI response
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: 'Hello! I\'m Neer, your AI assistant. How can I help you today?',
                    timestamp: new Date(),
                }]);
                setIsStreaming(false);
            }, 1000);
        } catch (error) {
            console.error('Failed to send message:', error);
            setIsStreaming(false);
        }
    };

    return (
        <FileDropZone>
            <div className="h-full flex flex-col relative">
                {/* Header */}
                <Header />

                {/* Main chat area */}
                <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 relative z-10">
                    {/* Messages */}
                    <MessageList messages={messages} isStreaming={isStreaming} />

                    {/* Input - Fixed at bottom */}
                    <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pb-2">
                        {/* Attachments Preview */}
                        <div className="mb-2">
                            <AttachmentPreview />
                        </div>

                        <InputArea
                            onSend={handleSendMessage}
                            disabled={isStreaming}
                        />
                        <Footer />
                    </div>
                </div>
            </div>
        </FileDropZone>
    );
}
