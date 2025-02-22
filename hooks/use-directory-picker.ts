import {useState, useEffect} from 'react';
import {useToast} from '@/hooks/use-toast';

export const useDirectoryPicker = () => {
    const {toast} = useToast();
    const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [isApiSupported, setIsApiSupported] = useState(true);

    useEffect(() => {
        if (!window.showDirectoryPicker) {
            setIsApiSupported(false);
            toast({
                title: 'Browser Compatibility',
                description: 'Your browser will automatically download files to default location',
            });
        }
    }, [toast]);

    const handleChooseDirectory = async () => {
        try {
            const handle = await window.showDirectoryPicker!({mode: 'readwrite'});
            setDirectoryHandle(handle);
            toast({
                title: 'Location Set',
                description: 'Files will be saved to selected directory',
            });
            return handle;
        } catch (_error) {
            toast({
                title: 'Action Cancelled',
                description: 'Directory selection was cancelled',
                variant: 'destructive',
            });
            return null;
        }
    };

    return {directoryHandle, isApiSupported, handleChooseDirectory, setDirectoryHandle};
};