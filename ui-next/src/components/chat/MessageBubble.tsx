import { motion } from 'framer-motion';

interface MessageBubbleProps {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
    const isUser = role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}
        >
            {/* AI Avatar */}
            {!isUser && (
                <div className="
          relative w-11 h-11 rounded-2xl mr-4 flex-shrink-0
          bg-gradient-to-br from-[#ff4d6d] to-[#ff708d]
          flex items-center justify-center text-white font-bold text-lg
          shadow-lg shadow-[#ff4d6d]/20
          after:absolute after:inset-0 after:rounded-2xl after:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]
        ">
                    N
                </div>
            )}

            {/* Message Content */}
            <div
                className={`
          max-w-[75%] px-7 py-5 rounded-[2rem]
          ${isUser
                        ? 'bg-gradient-to-br from-[#ff4d6d] to-[#ff708d] text-white shadow-xl shadow-[#ff4d6d]/15 rounded-tr-lg'
                        : 'glass-elevated text-white rounded-tl-lg'
                    }
          transition-all duration-300 hover:translate-y-[-2px]
        `}
            >
                <p className="whitespace-pre-wrap leading-relaxed text-[15px] font-medium tracking-tight">
                    {content}
                </p>
                <div
                    className={`
            text-[10px] mt-3 font-semibold tracking-wider uppercase opacity-50
            ${isUser ? 'text-white/80' : 'text-slate-400'}
          `}
                >
                    {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {/* User "Avatar" placeholder (optional, can just be gap) */}
            {isUser && <div className="w-4 flex-shrink-0" />}
        </motion.div>
    );
}
