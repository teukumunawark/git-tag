import React, {useEffect, useRef, useState} from "react";
import {useForm} from "react-hook-form";
import * as z from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form";
import {ChevronDown, Download, FileText, Search, Trash2,} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {Input} from "./ui/input";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";

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

export const FileForm: React.FC<FileFormProps> = ({onSubmit, isProcessing}) => {
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

    const [repositorySuggestions, setRepositorySuggestions] = useState<Repository[]>(
        []
    );
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [highlightedTagIndex, setHighlightedTagIndex] = useState(-1);

    const suggestionsRef = useRef<HTMLDivElement>(null);
    const serviceInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchTerm.trim().length > 0) {
                fetchRepositorySuggestions(searchTerm.trim());
            } else {
                setRepositorySuggestions([]);
                setShowSuggestions(false);
            }
        }, 400);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    // Close suggestions if user clicks outside the service name input or suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                serviceInputRef.current &&
                !serviceInputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchRepositorySuggestions = async (query: string) => {
        try {
            const response = await fetch(
                `http://localhost:8080/repository?search=${query}`
            );
            if (!response.ok) return;
            const data = await response.json();
            // Filter out the exact match to prevent re-suggesting the currently selected item
            const filtered = data.data.filter(
                (repo: Repository) => repo.name.toLowerCase() !== query.toLowerCase()
            );
            setRepositorySuggestions(filtered);
            setShowSuggestions(true);
        } catch (_) {
            // handle errors as needed
        }
    };

    const fetchTagSuggestions = async (repoId: number) => {
        try {
            const response = await fetch(`http://localhost:8080/tag/${repoId}`);
            if (!response.ok) return;
            const data = await response.json();
            setTagSuggestions(data.data.map((tagItem: Tag) => tagItem.name));
        } catch (_) {
            // handle errors as needed
        }
    };

    const handleServiceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        setSearchTerm(rawValue);
        // sanitize input
        const formatted = rawValue
            .replace(/[^a-zA-Z0-9 -]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        form.setValue("serviceName", formatted, {shouldValidate: true});
        // show suggestions if user is typing
        if (formatted.length > 0 && repositorySuggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!repositorySuggestions.length) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev + 1) % repositorySuggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : repositorySuggestions.length - 1
            );
        } else if (e.key === "Enter" && highlightedIndex !== -1) {
            e.preventDefault();
            const selectedRepo = repositorySuggestions[highlightedIndex];
            selectRepository(selectedRepo);
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    const selectRepository = (repo: Repository) => {
        form.setValue("serviceName", repo.name, {shouldValidate: true});
        setSearchTerm(repo.name);
        setShowSuggestions(false);
        setSelectedServiceId(repo.id);
        fetchTagSuggestions(repo.id);
    };

    const handleSuggestionClick = (repo: Repository) => {
        selectRepository(repo);
    };

    const handleServiceNameFocus = () => {
        if (searchTerm.trim().length > 0 && repositorySuggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    const shouldShowSuggestions = (): boolean => {
        return (
            showSuggestions &&
            searchTerm.trim().length > 0 &&
            repositorySuggestions.length > 0
        );
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!tagSuggestions.length) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedTagIndex((prev) => (prev + 1) % tagSuggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedTagIndex((prev) =>
                prev > 0 ? prev - 1 : tagSuggestions.length - 1
            );
        } else if (e.key === "Enter" && highlightedTagIndex !== -1) {
            e.preventDefault();
            form.setValue("tag", tagSuggestions[highlightedTagIndex], {
                shouldValidate: true,
            });
            setShowTagDropdown(false);
        } else if (e.key === "Escape") {
            setShowTagDropdown(false);
        }
    };

    const handleTagSuggestionClick = (tag: string) => {
        form.setValue("tag", tag, {shouldValidate: true});
        setShowTagDropdown(false);
    };

    const handleTagBlur = () => {
        // Delay to allow clicks on dropdown items
        setTimeout(() => setShowTagDropdown(false), 200);
    };

    const handleFormSubmit = async (values: FormValues) => {
        await onSubmit(values);
        // Reset the form
        form.reset();
        // Also reset the selected repository so user must re-select if needed
        setSelectedServiceId(null);
        // Clear tag suggestions
        setTagSuggestions([]);
        // Close the tag dropdown
        setShowTagDropdown(false);
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
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
                        <div className="space-y-4">
                            {/* Service Name Field */}
                            <FormField
                                control={form.control}
                                name="serviceName"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2 text-primary/80">
                                            Service Name
                                            <span className="text-xs text-muted-foreground">
                        (auto-format to lowercase)
                      </span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative" ref={suggestionsRef}>
                                                <Search
                                                    className="absolute left-4 top-[13.7px] h-5 w-5 text-muted-foreground"/>
                                                <Input
                                                    {...field}
                                                    ref={serviceInputRef}
                                                    onChange={(e) => {
                                                        handleServiceNameChange(e);
                                                        field.onChange(e);
                                                    }}
                                                    onKeyDown={handleKeyDown}
                                                    onFocus={handleServiceNameFocus}
                                                    placeholder="Search services..."
                                                    className="h-12 pl-12 uppercase"
                                                    autoComplete="off"
                                                />
                                                {shouldShowSuggestions() && (
                                                    <div
                                                        className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                                                    >
                                                        {repositorySuggestions.map((repo, index) => (
                                                            <div
                                                                key={repo.id}
                                                                onMouseDown={() => handleSuggestionClick(repo)}
                                                                className={`px-4 py-2 cursor-pointer ${
                                                                    highlightedIndex === index
                                                                        ? "bg-primary text-white"
                                                                        : ""
                                                                } hover:bg-gray-100`}
                                                            >
                                                                {highlightQuery(repo.name, searchTerm)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs"/>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Start typing to see available services
                                        </p>
                                    </FormItem>
                                )}
                            />

                            {/* Version Tag Field */}
                            <FormField
                                control={form.control}
                                name="tag"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2 text-primary/80">
                                            Version Tag
                                            <span className="text-xs text-muted-foreground">
                        (Format: X.X.X)
                      </span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Popover
                                                    open={selectedServiceId !== null && showTagDropdown}
                                                    onOpenChange={(open) => {
                                                        // Only allow opening if a service is selected
                                                        if (selectedServiceId) {
                                                            setShowTagDropdown(open);
                                                        } else {
                                                            setShowTagDropdown(false);
                                                        }
                                                    }}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={`w-full justify-between h-12 px-5 ${
                                                                field.value !== ""
                                                                    ? "text-primary"
                                                                    : "text-muted-foreground"
                                                            } ${!selectedServiceId ? "opacity-50 cursor-not-allowed" : ""}`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (!selectedServiceId) return;
                                                                setShowTagDropdown(true);
                                                            }}
                                                            tabIndex={0}
                                                            disabled={!selectedServiceId}
                                                        >
                                                            {field.value || "SELECT A VERSION"}
                                                            <ChevronDown
                                                                className="ml-2 h-4 w-4 text-muted-foreground"/>
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        onBlur={handleTagBlur}
                                                        onKeyDown={handleTagKeyDown}
                                                        className="w-[var(--radix-popover-trigger-width)] p-0"
                                                    >
                                                        <div className="max-h-60 overflow-y-auto">
                                                            {tagSuggestions.map((tag, index) => (
                                                                <div
                                                                    key={index}
                                                                    onMouseDown={() => handleTagSuggestionClick(tag)}
                                                                    className={`px-4 py-2 cursor-pointer ${
                                                                        highlightedTagIndex === index
                                                                            ? "bg-primary text-white"
                                                                            : ""
                                                                    } hover:bg-gray-100`}
                                                                >
                                                                    {tag}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs"/>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {selectedServiceId
                                                ? `Available versions for service ${selectedServiceId}`
                                                : "Select a service first"}
                                        </p>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Preview Section */}
                        <div className="mt-4 p-4 bg-muted/50 flex items-center">
                            <div className="h-full w-full">
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <FileText className="h-4 w-4"/>
                                        <span className="font-bold text-[13px] hidden sm:inline">Content:</span>
                                    </div>
                                    <pre className="flex-1 min-w-[200px] truncate">
                    {serviceNameWatch.toLowerCase() || "service-name"}:{tagWatch || "0.0.0"}
                  </pre>
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground truncate">
                                    <span className="font-semibold text-[11px] hidden sm:inline">File Name: </span>
                                    {fileNamePreview}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                className="ml-auto sm:ml-0 gap-0 flex items-center hover:bg-primary/30"
                                onClick={() => {
                                    form.reset();
                                    setSelectedServiceId(null);
                                    setTagSuggestions([]);
                                    setShowTagDropdown(false);
                                }}
                            >
                                <Trash2 className="sm:mr-2"/>
                                <span className="hidden sm:inline text-[0.775rem]">Clear Input</span>
                            </Button>
                        </div>

                        {/* Submit Button */}
                        <div className="space-y-4">
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isProcessing}
                                className="w-full h-12 text-base gap-3 hover:shadow-md transition-shadow"
                            >
                                {isProcessing ? (
                                    <span>Generating...</span>
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
        </Card>
    );
};

// highlight matched query
const highlightQuery = (text: string, query: string) => {
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
        <>
            {parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase() ? (
                        <span key={i} className="font-bold">
            {part}
          </span>
                    ) : (
                        part
                    )
            )}
        </>
    );
};