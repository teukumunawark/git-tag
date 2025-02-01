import React, {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import * as z from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form";
import {Download, FileText, Trash2} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";

const formSchema = z.object({
    serviceName: z
        .string()
        .min(1, "Service name is required")
        .regex(
            /^[a-zA-Z0-9- ]+$/,
            "Service name can only contain letters, numbers, and hyphens"
        )
        .transform((val) => val.trim().replace(/\s+/g, "-").toLowerCase()),
    tag: z
        .string()
        .min(1, "Tag is required")
        .regex(/^\d+\.\d+\.\d+$/, "Tag must be in format X.X.X"),
});

export type FormValues = z.infer<typeof formSchema>;

interface FileFormProps {
    onSubmit: (values: FormValues) => Promise<void>;
    isProcessing: boolean;
}

interface Repository {
    id: number;
    name: string;
}

interface Tag {
    name: string;
    env: string;
}

export const FileForm: React.FC<FileFormProps> =
    (
        {
            onSubmit,
            isProcessing
        }
    ) => {
        const form = useForm<FormValues>({
            resolver: zodResolver(formSchema),
            defaultValues: {
                serviceName: "",
                tag: "",
            },
        });

        const serviceNameWatch = form.watch("serviceName");
        const tagWatch = form.watch("tag");

        const fileNamePreview = `${(serviceNameWatch || "service-name")
            .replace(/\s+/g, "-")
            .toLowerCase()}-${tagWatch || "0.0.0"}.txt`;


        const [repositorySuggestions, setRepositorySuggestions] = useState<Repository[]>([]);
        const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
        const [searchTerm, setSearchTerm] = useState("");

        useEffect(() => {
            const timeout = setTimeout(() => {
                if (searchTerm.trim().length > 0) {
                    fetchRepositorySuggestions(searchTerm.trim()).then(() => console.log("Fetched repository suggestions"));
                }
            }, 500);
            return () => clearTimeout(timeout);
        }, [searchTerm]);

        const fetchRepositorySuggestions = async (query: string) => {
            try {
                const response = await fetch(`http://localhost:8080/repository?search=${query}`);
                if (!response.ok) {
                    console.log("Failed to fetch repository suggestions");
                }
                const data = await response.json();
                setRepositorySuggestions(data.data);
            } catch (error) {
                console.error("Error fetching repository suggestions:", error);
            }
        };

        const fetchTagSuggestions = async (repoId: number) => {
            try {
                const response = await fetch(`http://localhost:8080/tag/${repoId}`);
                if (!response.ok) {
                    console.log("Failed to fetch tag suggestions");
                }
                const data = await response.json();
                const tags = data.data.map((tagItem: Tag) => tagItem.name);
                setTagSuggestions(tags);
            } catch (error) {
                console.error("Error fetching tag suggestions:", error);
            }
        };


        const handleServiceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value;
            setSearchTerm(rawValue);
            const formatted = rawValue.replace(/[^a-zA-Z0-9 -]/g, "").replace(/\s+/g, " ").trim();
            form.setValue("serviceName", formatted, {shouldValidate: true});
        };

        const handleServiceNameBlur = () => {
            const currentValue = form.getValues("serviceName");
            const selectedRepo = repositorySuggestions.find(
                (repo) => repo.name.toLowerCase() === currentValue.toLowerCase()
            );
            if (selectedRepo) {
                fetchTagSuggestions(selectedRepo.id).then(() => console.log("Fetched tag suggestions"));
            } else {
                setTagSuggestions([]);
            }
        };

        return (
            <Card className="shadow-lg hover:shadow-xl transition-shadow h-fit">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <FileText className="h-6 w-6 text-primary"/>
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
                                                <span
                                                    className="text-xs text-muted-foreground">(auto-format to lowercase)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        onChange={(e) => {
                                                            handleServiceNameChange(e);
                                                            field.onChange(e);
                                                        }}
                                                        onBlur={handleServiceNameBlur}
                                                        placeholder="e.g. user-service"
                                                        className="h-12 text-base uppercase"
                                                        list="repositorySuggestions"
                                                    />
                                                    <datalist id="repositorySuggestions">
                                                        {repositorySuggestions.map((repo) => (
                                                            <option key={repo.id} value={repo.name}/>
                                                        ))}
                                                    </datalist>
                                                </div>
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
                                                <span className="text-xs text-muted-foreground">(Format: X.X.X)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        placeholder="e.g. 1.0.0"
                                                        className="h-12 text-base"
                                                        list="tagSuggestions"
                                                    />
                                                    <datalist id="tagSuggestions">
                                                        {tagSuggestions.map((tag, i) => (
                                                            <option key={i} value={tag}/>
                                                        ))}
                                                    </datalist>
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-xs"/>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="mt-4 p-4 bg-muted/50 flex items-center">
                                <div className="h-full w-full">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <FileText className="h-4 w-4"/>
                                            <span className="font-bold text-[13px] hidden sm:inline">Content:</span>
                                        </div>
                                        <pre
                                            className="flex-1 min-w-[200px] truncate">{serviceNameWatch.toLowerCase() || "service-name"}:{tagWatch || "0.0.0"}</pre>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground truncate">
                                        <span
                                            className="font-semibold text-[11px] hidden sm:inline">File Name:{" "} </span>
                                        {fileNamePreview}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    className="ml-auto sm:ml-0 gap-0 flex items-center hover:bg-primary/30"
                                    onClick={() => {
                                        form.reset({
                                            serviceName: "",
                                            tag: "",
                                        });
                                    }}
                                >
                                    <Trash2 className="sm:mr-2"/>
                                    <span className="hidden sm:inline text-[0.775rem]">Clear Input</span>
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isProcessing}
                                    className="w-full h-12 text-base gap-3 hover:shadow-md transition-shadow"
                                >
                                    {isProcessing ? (<span>Generating...</span>) : (
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
            </Card>
        );
    };
