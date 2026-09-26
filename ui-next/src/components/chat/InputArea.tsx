import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFileStore } from '../../store/fileStore';

interface InputAreaProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export function InputArea({ onSend, disabled }: InputAreaProps) {
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { addFiles } = useFileStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        if (!input.trim() || disabled) return;
        onSend(input);
        setInput('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleVoiceToggle = () => {
        setIsRecording(!isRecording);
        // TODO: Implement voice recording
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            addFiles(Array.from(e.target.files));
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="
      flex items-end gap-3 px-6 py-4 rounded-3xl
      glass-elevated border-white/20
      focus-within:border-[#ff4d6d]/40 focus-within:shadow-[0_0_30px_rgba(255,77,109,0.15)]
      transition-all duration-300
    ">
            <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {/* Attach Button */}
            <button
                onClick={handleFileClick}
                className="
        p-2.5 rounded-2xl text-slate-400
        hover:bg-white/10 hover:text-[#ff4d6d]
        transition-all duration-200 mb-0.5
      ">
                <Paperclip className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="How can Neer help you today?"
                disabled={disabled}
                className="
          flex-1 resize-none bg-transparent outline-none
          text-white placeholder:text-slate-500
          min-h-[44px] max-h-48 py-2.5 text-[15px]
        "
                rows={1}
            />

            {/* Voice Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleVoiceToggle}
                className={`
          p-2.5 rounded-2xl transition-all duration-300 mb-0.5
          ${isRecording
                        ? 'bg-gradient-to-br from-[#ff4d6d] to-[#ff708d] text-white shadow-lg shadow-[#ff4d6d]/30 animate-pulse'
                        : 'text-slate-400 hover:bg-white/10 hover:text-[#ff4d6d]'
                    }
        `}
            >
                <Mic className="w-5 h-5" />
            </motion.button>

            {/* Send Button */}
            <motion.button
                whileHover={{ scale: 1.05, translateY: -2 }}
                whileTap={{ scale: 0.95, translateY: 0 }}
                onClick={handleSubmit}
                disabled={!input.trim() || disabled}
                className="
          px-6 py-2.5 rounded-2xl font-bold mb-0.5
          bg-gradient-to-br from-[#ff4d6d] to-[#ff708d]
          text-white shadow-lg shadow-[#ff4d6d]/20
          hover:shadow-xl hover:shadow-[#ff4d6d]/30
          disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed
          transition-all duration-300
        "
            >
                <Send className="w-5 h-5" />
            </motion.button>
        </div>
    );
}
