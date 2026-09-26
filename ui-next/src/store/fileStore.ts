import { create } from 'zustand';

export interface UploadedFile {
    id: string;
    file: File;
    preview?: string;
    // progress: number; // For future real upload progress
}

interface FileStore {
    attachments: UploadedFile[];
    addFiles: (files: File[]) => void;
    removeFile: (id: string) => void;
    clearAttachments: () => void;
}

export const useFileStore = create<FileStore>((set) => ({
    attachments: [],

    addFiles: (files) => {
        const newAttachments = files.map(file => ({
            id: crypto.randomUUID(),
            file,
            preview: file.type.startsWith('image/')
                ? URL.createObjectURL(file)
                : undefined
        }));

        set((state) => ({
            attachments: [...state.attachments, ...newAttachments]
        }));
    },

    removeFile: (id) => set((state) => {
        const file = state.attachments.find(a => a.id === id);
        if (file?.preview) URL.revokeObjectURL(file.preview);
        return {
            attachments: state.attachments.filter(a => a.id !== id)
        };
    }),

    clearAttachments: () => set((state) => {
        state.attachments.forEach(a => {
            if (a.preview) URL.revokeObjectURL(a.preview);
        });
        return { attachments: [] };
    })
}));
