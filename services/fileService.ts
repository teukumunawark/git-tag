export type RecentFile = {
    name: string;
    path: string;
    createdAt: string;
    source: 'directory' | 'download' | 'upload';
};

export const loadRecentFiles = async (directoryHandle: FileSystemDirectoryHandle): Promise<RecentFile[]> => {
    const recent: RecentFile[] = [];

    for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.txt')) {
            try {
                const fileHandle = entry as FileSystemFileHandle;
                const file = await fileHandle.getFile();

                recent.push({
                    name: entry.name,
                    path: `${directoryHandle.name}/${entry.name}`,
                    createdAt: new Date(file.lastModified).toLocaleString(),
                    source: 'directory'
                });
            } catch (error) {
                console.error(`Failed to get metadata for ${entry.name}:`, error);
            }
        }
    }

    recent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return recent;
};

export const saveFileToDirectory = async (directoryHandle: FileSystemDirectoryHandle, filename: string, content: string): Promise<RecentFile> => {
    const fileHandle = await directoryHandle.getFileHandle(filename, {create: true});
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();

    return {
        name: filename,
        path: `${directoryHandle.name}/${filename}`,
        createdAt: new Date().toLocaleString(),
        source: 'directory'
    };
};

export const handleDownload = (filename: string, content: string): RecentFile => {
    const blob = new Blob([content], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    return {
        name: filename,
        path: "Downloads folder",
        createdAt: new Date().toLocaleString(),
        source: 'download'
    };
};

export const deleteFile = async (file: RecentFile, directoryHandle: FileSystemDirectoryHandle | null): Promise<void> => {
    if (file.source === 'directory') {
        if (!directoryHandle) {
            throw new Error("Directory not selected");
        }
        await directoryHandle.removeEntry(file.name);
    }
};