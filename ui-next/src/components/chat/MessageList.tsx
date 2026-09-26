import { motion } from 'framer-motion';
import { MessageBubble } from './MessageBubble';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface MessageListProps {
    messages: Message[];
    isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
    return (
        <div className="flex-1 overflow-y-auto py-8 space-y-4 scrollbar-hide">
            {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="text-center space-y-6"
                    >
                        <div className="
                            relative w-24 h-24 mx-auto rounded-[2rem]
                            bg-gradient-to-br from-[#ff4d6d] to-[#ff708d]
                            flex items-center justify-center
                            text-white font-bold text-4xl
                            shadow-2xl shadow-[#ff4d6d]/30
                            after:absolute after:inset-0 after:rounded-[2rem] after:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]
                        ">
                            N
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-white tracking-tight font-display">
                                Welcome to Neer
                            </h2>
                            <p className="text-slate-400 text-lg max-w-sm mx-auto font-medium">
                                Your intelligent AI companion. <br /> How can I assist you today?
                            </p>
                        </div>
                    </motion.div>
                </div>
            ) : (
                messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        role={message.role}
                        content={message.content}
                        timestamp={message.timestamp}
                    />
                ))
            )}

            {isStreaming && (
                <div className="flex justify-start">
                    <div className="glass-surface px-6 py-4 rounded-3xl">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-sm text-slate-600">Neer is thinking...</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
