"use client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form";
import {useEffect, useState} from "react";
import {Clock, Download, FileText, FolderCheck, FolderInput, Loader2, Trash} from "lucide-react";
import {toast} from "@/hooks/use-toast";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {Skeleton} from "@/components/ui/skeleton";
import {ModeToggle} from "@/components/mode-toggle";

const formSchema = z.object({
    serviceName: z.string().min(1, "Service name is required"),
    tag: z.string().min(1, "Tag is required"),
});

type RecentFile = {
    name: string;
    path: string;
    createdAt: string;
    source: 'directory' | 'download';
};

export default function Home() {
    const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [isApiSupported, setIsApiSupported] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
    const [lastSaved, setLastSaved] = useState<{ name: string, path: string } | null>(null);

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
            await loadRecentFiles(handle);
        } catch (_error) {
            toast({
                title: "Action Cancelled",
                description: "Directory selection was cancelled",
                variant: "destructive",
            });
        }
    };

    const loadRecentFiles = async (directoryHandle: FileSystemDirectoryHandle) => {
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
                        source: 'directory' as const
                    });
                } catch (error) {
                    console.error(`Failed to get metadata for ${entry.name}:`, error);
                }
            }
        }

        recent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setRecentFiles(recent);
    };

    const saveFileToDirectory = async (filename: string, content: string) => {
        if (!directoryHandle) return;

        try {
            setIsProcessing(true);
            const fileHandle = await directoryHandle.getFileHandle(filename, {create: true});
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            const newFile = {
                name: filename,
                path: `${directoryHandle.name}/${filename}`,
                createdAt: new Date().toLocaleString(),
                source: 'directory' as const
            };

            setRecentFiles(prev => [newFile, ...prev.slice(0, 10)]);
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
    };

    const handleDownload = (filename: string, content: string) => {
        setIsProcessing(true);
        try {
            const blob = new Blob([content], {type: "text/plain"});
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);

            const newFile = {
                name: filename,
                path: "Downloads folder",
                createdAt: new Date().toLocaleString(),
                source: 'download' as const
            };

            setRecentFiles(prev => [newFile, ...prev.slice(0, 10)]);
            setLastSaved(newFile);
            setTimeout(() => setLastSaved(null), 5000);

        } catch (_error) {
            toast({
                title: "Download Failed",
                description: "Error processing file",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteFile = async (file: RecentFile) => {
        try {
            if (file.source === 'directory') {
                if (!directoryHandle) {
                    toast({
                        title: "Deletion Failed",
                        description: "Directory not selected",
                        variant: "destructive",
                    });
                    return;
                }
                await directoryHandle.removeEntry(file.name);
            }

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

    function onSubmit(values: z.infer<typeof formSchema>) {
        const content = `${values.serviceName}:${values.tag}`;
        const filename = `${values.serviceName.replace(/ /g, '-')}-${values.tag}.txt`;

        if (directoryHandle && isApiSupported) {
            saveFileToDirectory(filename, content);
        } else {
            handleDownload(filename, content);
        }

        // form.reset();
    }


    return (
        <div className="max-w-screen-2xl mx-auto">
            <header
                className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4">
                    <span className="font-semibold">PROJECT AMBISIUS SQUAD 2</span>

                    <ModeToggle/>
                </div>
            </header>

            {/* Main Content */}
            <div className="py-10">
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
                                                    className="truncate max-w-[200px]">Saving to: {directoryHandle.name}
                                                    </span>
                                            </>
                                        ) : (
                                            <>
                                                <FolderInput className="h-5 w-5"/>
                                                <span>Select Save Location</span>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <Separator className="mb-4"/>
                        <CardContent className="space-y-3">
                            {recentFiles.length > 0 ? (
                                recentFiles
                                    .filter(file => {
                                        const fileDate = new Date(file.createdAt);
                                        const oneDayAgo = new Date();
                                        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
                                        return fileDate >= oneDayAgo;
                                    })
                                    .slice(0, 9)
                                    .map((file, index) => (
                                        <div
                                            key={index}
                                            className="group flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                                            onClick={() => navigator.clipboard.writeText(`${file.path}/${file.name}`)}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{file.name.replace('.txt', '')}</span>
                                                    <Badge variant="outline" className="text-xs py-0 px-2">
                                                        .txt
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground font-mono truncate max-w-[500px]">
                                                    {file.path}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="gap-2 text-xs">
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
                    </Card>
                </div>
            </div>
        </div>
    );
}