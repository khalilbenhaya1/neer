import { X, FileText, Image as ImageIcon, Film } from 'lucide-react';
import { useFileStore } from '../../store/fileStore';
import { motion, AnimatePresence } from 'framer-motion';

export function AttachmentPreview() {
    const { attachments, removeFile } = useFileStore();

    if (attachments.length === 0) return null;

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 px-1">
            <AnimatePresence>
                {attachments.map((attachment) => (
                    <motion.div
                        key={attachment.id}
                        initial={{ opacity: 0, scale: 0.8, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative flex-shrink-0 group"
                    >
                        <div className="
              w-20 h-20 rounded-xl overflow-hidden
              border border-white/20 bg-white/10 backdrop-blur-md
              flex items-center justify-center relative
            ">
                            {attachment.preview ? (
                                <img
                                    src={attachment.preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <FileIcon type={attachment.file.type} />
                            )}

                            {/* Overlay for non-images to show name */}
                            {!attachment.preview && (
                                <div className="absolute inset-x-0 bottom-0 p-1 bg-black/50 text-[10px] text-white truncate text-center">
                                    {attachment.file.name}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => removeFile(attachment.id)}
                            className="
                absolute -top-1 -right-1 p-0.5 rounded-full
                bg-slate-900/80 text-white opacity-0 group-hover:opacity-100
                transition-opacity shadow-sm border border-white/20
              "
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

function FileIcon({ type }: { type: string }) {
    if (type.startsWith('video/')) return <Film className="w-8 h-8 text-blue-400" />;
    if (type.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-purple-400" />; // Fallback
    return <FileText className="w-8 h-8 text-slate-400" />;
}
