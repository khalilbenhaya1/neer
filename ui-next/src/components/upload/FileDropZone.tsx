import { useFileStore } from '../../store/fileStore';
import { useCallback, useState } from 'react';

export function FileDropZone({ children }: { children: React.ReactNode }) {
    const addFiles = useFileStore(state => state.addFiles);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files?.length > 0) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    }, [addFiles]);

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="h-full flex flex-col relative"
        >
            {isDragging && (
                <div className="
          absolute inset-0 z-50 
          bg-blue-500/10 backdrop-blur-sm
          border-4 border-dashed border-blue-400/50
          rounded-xl m-4
          flex items-center justify-center
        ">
                    <div className="bg-white/90 p-6 rounded-2xl shadow-xl text-center">
                        <p className="text-xl font-bold text-blue-600">Drop files here</p>
                        <p className="text-sm text-slate-500">to add them to the chat</p>
                    </div>
                </div>
            )}
            {children}
        </div>
    );
}
