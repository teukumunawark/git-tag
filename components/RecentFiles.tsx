import React from "react";
import {FileText, FolderCheck, FolderInput, Trash} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {Input} from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {RecentFile} from "@/services/fileService";

interface RecentFilesProps {
    recentFiles: RecentFile[];
    onDelete: (file: RecentFile) => void;
    onChooseDirectory: () => void;
    directoryHandle: FileSystemDirectoryHandle | null;
    isApiSupported: boolean;
    isProcessing: boolean;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
    setItemsPerPage: (value: number) => void;
    setCurrentPage: (value: number) => void;
}

export const RecentFiles: React.FC<RecentFilesProps> = ({
                                                            recentFiles,
                                                            onDelete,
                                                            onChooseDirectory,
                                                            directoryHandle,
                                                            isApiSupported,
                                                            isProcessing,
                                                            itemsPerPage,
                                                            currentPage,
                                                            totalPages,
                                                            setItemsPerPage,
                                                            setCurrentPage,
                                                        }) => {
    const getVisiblePages = (): number[] => {
        const maxPages = 10;
        const startPage = Math.max(currentPage - Math.floor(maxPages / 2), 1);
        const endPage = Math.min(startPage + maxPages - 1, totalPages);
        return Array.from({length: endPage - startPage + 1}, (_, i) => startPage + i);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        if (value > 0) {
            setItemsPerPage(value);
            setCurrentPage(1);
        }
    };

    const paginatedFiles = recentFiles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <Card className="shadow-lg hover:shadow-xl transition-shadow h-fit">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <FileText className="h-6 w-6 text-primary"/>
                        </div>
                        <div>
                            <CardTitle>Recent Files</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {recentFiles.length} files generated
                            </p>
                        </div>
                    </div>
                    {isApiSupported && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onChooseDirectory}
                            disabled={isProcessing}
                            className="gap-2 h-12 border-dashed hover:bg-accent/50"
                        >{directoryHandle
                            ? (
                                <>
                                    <FolderCheck className="h-5 w-5 text-green-500"/>
                                    <span className="truncate hidden lg:inline-block">Saving to: {directoryHandle.name}
                                    </span>
                                </>)
                            : (
                                <>
                                    <FolderInput className="h-5 w-5"/>
                                    <span className="hidden lg:inline-block">Select Save Location</span>
                                </>)
                        }</Button>
                    )}
                </div>
            </CardHeader>
            <Separator/>
            <CardContent className="space-y-3 p-2 lg:p-4">
                {recentFiles.length > 0 ? (
                    paginatedFiles.map((file, index) => {
                        const serviceName = file.name
                            .replace(/\[RELEASE]\s*/, "")
                            .replace(".txt", "")
                            .replace(/-(\d+\.\d+\.\d+)$/, ":$1");
                        const filePath = file.path.replace(/\[RELEASE]\s*/, "");

                        return (
                            <div
                                key={index}
                                className="group flex flex-col sm:flex-row items-start sm:items-center p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer lg:justify-between"
                            >
                                <div className="space-y-1 lg:w-5/6">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium"><span
                                            className="text-primary">{serviceName}</span></span>
                                        <span className="border border-gray-400 rounded px-2 text-xs py-0">.txt</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground overflow-ellipsis font-mono truncate">
                                        {filePath}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:bg-red-100/50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(file);
                                        }}
                                    >
                                        <Trash className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center text-muted-foreground">
                        No files generated yet
                    </div>
                )}
            </CardContent>
            {recentFiles.length > 0 && (
                <CardFooter className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 pt-2 w-full">
                    <div className="w-full flex flex-col items-center gap-2 lg:flex-row lg:items-center">
                        <Input
                            id="itemsPerPage"
                            type="number"
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            className="border p-2 rounded w-12"
                            min={1}
                        />
                        <span className="text-sm text-muted-foreground">
                            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, recentFiles.length)} -{" "}
                            {Math.min(currentPage * itemsPerPage, recentFiles.length)} of{" "}
                            {recentFiles.length} files
                        </span>
                    </div>

                    <Pagination className="w-full justify-center lg:justify-end">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePrevPage();
                                    }}
                                />
                            </PaginationItem>
                            {getVisiblePages()
                                .slice(0, window.innerWidth < 640 ? 3 : 5)
                                .map((page) => (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            href="#"
                                            isActive={currentPage === page}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCurrentPage(page);
                                            }}
                                        >{page}</PaginationLink>
                                    </PaginationItem>
                                ))}
                            {currentPage < totalPages - 2 && (
                                <PaginationItem>
                                    <PaginationEllipsis/>
                                </PaginationItem>
                            )}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleNextPage();
                                    }}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </CardFooter>
            )}
        </Card>
    );
};
