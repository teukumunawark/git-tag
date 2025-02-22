"use client";
import React from "react";
import {FileForm} from "@/components/file-form";
import {RecentFiles} from "@/components/recent-files";
import {loadRecentFiles,} from "@/services/fileService";
import {useDirectoryPicker} from "@/hooks/use-directory-picker";
import {useFileManagement} from "@/hooks/use-file-management";
import {usePagination} from "@/hooks/use-pagination";

export default function Page() {
    const {directoryHandle, isApiSupported, handleChooseDirectory, setDirectoryHandle} = useDirectoryPicker();
    const {
        recentFiles,
        setRecentFiles,
        isProcessing,
        handleDeleteFile,
        onSubmit,
        setIsProcessing
    } = useFileManagement(directoryHandle, isApiSupported);
    const {currentPage, setCurrentPage, totalPages} = usePagination(recentFiles.length, 8);
    const [itemsPerPage, setItemsPerPage] = React.useState(8);

    React.useEffect(() => {
        if (directoryHandle) {
            loadRecentFiles(directoryHandle).then(setRecentFiles);
        }
    }, [directoryHandle, setRecentFiles]);

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
