import {useState} from 'react';
import {useToast} from '@/hooks/use-toast';
import {deleteFile, handleDownload, saveFileToDirectory, RecentFile} from '@/services/fileService';
import {FormValues} from '@/components/file-form';

export const useFileManagement = (directoryHandle: FileSystemDirectoryHandle | null, isApiSupported: boolean) => {
    const {toast} = useToast();
    const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDeleteFile = async (file: RecentFile) => {
        try {
            await deleteFile(file, directoryHandle);
            setRecentFiles((prev) => prev.filter((f) => f.name !== file.name));
            toast({
                title: 'File Deleted',
                description: `${file.name} has been ${
                    file.source === 'directory' ? 'deleted from directory' : 'removed from recent files'
                }`,
            });
        } catch (error) {
            console.error('Delete error:', error);
            toast({
                title: 'Deletion Failed',
                description: 'Failed to delete the file',
                variant: 'destructive',
            });
        }
    };

    const onSubmit = async (values: FormValues) => {
        const content = `${values.serviceName}:${values.tag}`;
        const filename = `[RELEASE] ${values.serviceName}-${values.tag}.txt`;

        const isDuplicate = recentFiles.some(
            (file) => file.name.toLowerCase() === filename.toLowerCase()
        );
        if (isDuplicate) {
            toast({
                title: 'File Already Exists',
                description: 'Rename the service or increment the version tag',
                variant: 'destructive',
            });
            return;
        }

        if (directoryHandle && isApiSupported) {
            try {
                setIsProcessing(true);
                const newFile = await saveFileToDirectory(directoryHandle, filename, content);
                setRecentFiles((prev) => [newFile, ...prev]);
                toast({
                    title: 'File Saved',
                    description: `${filename} saved to ${directoryHandle.name}`,
                });
            } catch (_error) {
                toast({
                    title: 'Save Failed',
                    description: 'Please check directory permissions',
                    variant: 'destructive',
                });
            } finally {
                setIsProcessing(false);
            }
        } else {
            const newFile = handleDownload(filename, content);
            setRecentFiles((prev) => [newFile, ...prev]);
        }
    };

    return {recentFiles, setRecentFiles, isProcessing, handleDeleteFile, onSubmit, setIsProcessing};
};