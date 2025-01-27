interface Window {
    showDirectoryPicker?: (options?: {
        id?: string;
        mode?: 'read' | 'readwrite';
        startIn?: FileSystemHandle;
    }) => Promise<FileSystemDirectoryHandle>;
}

interface FileSystemDirectoryHandle {
    name: string;
    getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemFileHandle>;
    values: () => AsyncIterableIterator<FileSystemHandle>;
}

interface FileSystemFileHandle {
    createWritable: () => Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
    write: (content: string) => Promise<void>;
    close: () => Promise<void>;
}