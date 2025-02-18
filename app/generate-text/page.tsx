"use client";
import React, {useEffect, useState} from "react";
import {FileForm, FormValues} from "@/components/file-form";
import {RecentFiles} from "@/components/recent-files";
import {useToast} from "@/hooks/use-toast";
import {deleteFile, handleDownload, loadRecentFiles, RecentFile, saveFileToDirectory,} from "@/services/fileService";

export default function Page() {
    const {toast} = useToast();
    const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [isApiSupported, setIsApiSupported] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    useEffect(() => {
        if (!window.showDirectoryPicker) {
            setIsApiSupported(false);
            toast({
                title: "Browser Compatibility",
                description: "Your browser will automatically download files to default location",
            });
        }
    }, [toast]);

    const handleChooseDirectory = async () => {
        try {
            const handle = await window.showDirectoryPicker!({mode: "readwrite"});
            setDirectoryHandle(handle);
            toast({
                title: "Location Set",
                description: "Files will be saved to selected directory",
            });
            const recent = await loadRecentFiles(handle);
            setRecentFiles(recent);
        } catch (_error) {
            toast({
                title: "Action Cancelled",
                description: "Directory selection was cancelled",
                variant: "destructive",
            });
        }
    };

    const handleDeleteFile = async (file: RecentFile) => {
        try {
            await deleteFile(file, directoryHandle);
            setRecentFiles((prev) => prev.filter((f) => f.name !== file.name));
            toast({
                title: "File Deleted",
                description: `${file.name} has been ${
                    file.source === "directory" ? "deleted from directory" : "removed from recent files"
                }`,
            });
        } catch (error) {
            console.error("Delete error:", error);
            toast({
                title: "Deletion Failed",
                description: "Failed to delete the file",
                variant: "destructive",
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
                title: "File Already Exists",
                description: "Rename the service or increment the version tag",
                variant: "destructive",
            });
            return;
        }

        if (directoryHandle && isApiSupported) {
            try {
                setIsProcessing(true);
                const newFile = await saveFileToDirectory(directoryHandle, filename, content);
                setRecentFiles((prev) => [newFile, ...prev]);
                toast({
                    title: "File Saved",
                    description: `${filename} saved to ${directoryHandle.name}`,
                });
            } catch (_error) {
                toast({
                    title: "Save Failed",
                    description: "Please check directory permissions",
                    variant: "destructive",
                });
            } finally {
                setIsProcessing(false);
            }
        } else {
            const newFile = handleDownload(filename, content);
            setRecentFiles((prev) => [newFile, ...prev]);
        }
    };

    const totalPages = Math.ceil(recentFiles.length / itemsPerPage);

    return (
        <div className="mx-auto px-4">
            <div className="py-4 mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FileForm
                        onSubmit={onSubmit}
                        isProcessing={isProcessing}
                    />
                    <RecentFiles
                        recentFiles={recentFiles}
                        onDelete={handleDeleteFile}
                        onChooseDirectory={handleChooseDirectory}
                        directoryHandle={directoryHandle}
                        isApiSupported={isApiSupported}
                        isProcessing={isProcessing}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setItemsPerPage={setItemsPerPage}
                        setCurrentPage={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}
