"use client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form";
import {useEffect, useState} from "react";
import {Clock, Download, FileText, FolderCheck, FolderInput, GitPullRequestCreate, Loader2, Trash} from "lucide-react";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {Skeleton} from "@/components/ui/skeleton";
import {ModeToggle} from "@/components/mode-toggle";
import {useToast} from "@/hooks/use-toast"
import {deleteFile, handleDownload, loadRecentFiles, RecentFile, saveFileToDirectory} from "@/services/fileService";
import {
    Pagination,
    PaginationContent, PaginationEllipsis,
    PaginationItem,
    PaginationLink, PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination";

const formSchema = z.object({
    serviceName: z.string().min(1, "Service name is required"),
    tag: z.string().min(1, "Tag is required"),
});

export default function Home() {
    const {toast} = useToast();

    const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [isApiSupported, setIsApiSupported] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
    const [lastSaved, setLastSaved] = useState<{ name: string, path: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            serviceName: "",
            tag: "",
        },
    });

    useEffect(() => {
        if (!window.showDirectoryPicker) {
            setIsApiSupported(false);
            toast({
                title: "Browser Compatibility",
                description: "Your browser will automatically download files to default location",
            });
        }
    }, []);

    const handleChooseDirectory = async () => {
        try {
            const handle = await window.showDirectoryPicker!({mode: 'readwrite'});
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
            setRecentFiles(prev => prev.filter(f => f.name !== file.name));
            toast({
                title: "File Deleted",
                description: `${file.name} has been ${file.source === 'directory' ? 'deleted from directory' : 'removed from recent files'}`,
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

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const content = `${values.serviceName}:${values.tag}`;
        const filename = `${values.serviceName.replace(/ /g, '-')}-${values.tag}.txt`;

        if (directoryHandle && isApiSupported) {
            try {
                setIsProcessing(true);
                const newFile = await saveFileToDirectory(directoryHandle, filename, content);
                setRecentFiles(prev => [newFile, ...prev]);
                setLastSaved(newFile);
                setTimeout(() => setLastSaved(null), 8000);
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
            setRecentFiles(prev => [newFile, ...prev]);
            setLastSaved(newFile);
            setTimeout(() => setLastSaved(null), 5000);
        }
    };

    const totalPages = Math.ceil(recentFiles.length / itemsPerPage);

    const getVisiblePages = () => {
        const maxPages = 5;
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

    const paginatedFiles = recentFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    return (
        <div className="mx-auto px-4 lg:px-0">
            <header
                className="sticky top-0 z-50 w-full border-b backdrop-blur">
                <div className="container flex h-20 items-center mx-auto justify-between">
                    <div className="flex items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg flex items-center justify-center">
                                <GitPullRequestCreate className="text-xl font-bold"/>
                            </div>
                            <span
                                className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent hidden lg:inline-block">Project Ambisius Squad 2<span
                                className="text-sm ml-2 bg-primary/10 text-primary px-2 py-1 rounded-full hidden lg:inline-block">v1.0</span></span>
                        </div>
                    </div>
                    <ModeToggle/>
                </div>
            </header>

            {/* Main Content */}
            <div className="py-6 mx-auto container">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Form Section */}
                    <Card className="shadow-lg hover:shadow-xl transition-shadow h-[380px]">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <FolderCheck className="h-6 w-6 text-primary"/>
                                </div>
                                <div>
                                    <CardTitle>Create New File</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Enter service details to generate file
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <Separator className="mb-6"/>

                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="serviceName"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2 text-primary/80">
                                                        Service Name
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. user-service"
                                                            className="h-12 text-base"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs"/>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="tag"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2 text-primary/80">
                                                        Version Tag
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. 1.0.0"
                                                            className="h-12 text-base"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs"/>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <Button
                                            type="submit"
                                            size="lg"
                                            disabled={isProcessing}
                                            className="w-full h-12 text-base gap-3 hover:shadow-md transition-shadow"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="h-5 w-5"/>
                                                    <span>Generate File</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>

                        {lastSaved && (
                            <div
                                className="mt-10 p-4 bg-green-50/50 rounded-lg border border-green-200 flex items-center gap-3">
                                <FolderCheck className="h-6 w-6 text-green-600 flex-shrink-0"/>
                                <div>
                                    <p className="font-medium text-green-800">File saved successfully!</p>
                                    <p className="text-sm text-green-700 mt-1">
                                        {lastSaved.name} saved to {lastSaved.path}
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Recent Files Section */}
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
                                        onClick={handleChooseDirectory}
                                        disabled={isProcessing}
                                        className="gap-2 h-12 border-dashed hover:bg-accent/50"
                                    >
                                        {directoryHandle ? (
                                            <>
                                                <FolderCheck className="h-5 w-5 text-green-500"/>
                                                <span
                                                    className="truncate hidden lg:inline-block">Saving to: {directoryHandle.name}
                                                    </span>
                                            </>
                                        ) : (
                                            <>
                                                <FolderInput className="h-5 w-5"/>
                                                <span className="hidden lg:inline-block">Select Save Location</span>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <Separator className="mb-4"/>
                        <CardContent className="space-y-3  p-2 lg:p-4">
                            {recentFiles.length > 0 ? (
                                paginatedFiles
                                    .filter(file => {
                                        const fileDate = new Date(file.createdAt);
                                        const oneDayAgo = new Date();
                                        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
                                        return fileDate >= oneDayAgo;
                                    })
                                    .map((file, index) => (
                                        <div
                                            key={index}
                                            className="group flex flex-col sm:flex-row items-start sm:items-center p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer lg:justify-between"
                                            onClick={() => navigator.clipboard.writeText(`${file.path}/${file.name}`)}
                                        >
                                            <div className="space-y-1 w-full lg:w-auto">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{file.name.replace('.txt', '')}</span>
                                                    <Badge variant="outline" className="text-xs py-0 px-2">
                                                        .txt
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground font-mono truncate sm:max-w-sm lg:max-w-full">
                                                    {file.path}
                                                </p>
                                            </div>

                                            <div
                                                className="flex flex-row justify-between items-center gap-2 sm:gap-3 mt-2 sm:mt-0 w-full sm:w-auto">
                                                <Badge variant="outline" className="gap-2 text-xs sm:text-sm">
                                                    <Clock className="h-3.5 w-3.5"/>
                                                    {file.createdAt}
                                                </Badge>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:bg-red-100/50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteFile(file);
                                                    }}
                                                >
                                                    <Trash className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="space-y-3">
                                    {Array(3)
                                        .fill(0)
                                        .map((_, i) => (
                                            <Skeleton key={i} className="h-[62px] w-full rounded-lg"/>
                                        ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex pt-2">
                            <Input
                                id="itemsPerPage"
                                type="number"
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                                className="border p-2 rounded w-12"
                                min={1}
                            ></Input>
                            <div className="w-4/6 ms-2">
                                <span className="text-sm text-muted-foreground">
                                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, recentFiles.length)} -{" "}
                                    {Math.min(currentPage * itemsPerPage, recentFiles.length)} of {recentFiles.length} files
                                </span>

                            </div>

                            <Pagination className="w-full justify-end">
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

                                    {getVisiblePages().map((page) => (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href="#"
                                                isActive={currentPage === page}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    setCurrentPage(page)
                                                }}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}

                                    {currentPage < totalPages - 2 && (
                                        <PaginationItem>
                                            <PaginationEllipsis />
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
                    </Card>
                </div>
            </div>
        </div>
    );
}