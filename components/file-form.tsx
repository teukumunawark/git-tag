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
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";

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
    const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
        null
    );
    const [originalTag, setOriginalTag] = useState<string>("");
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [highlightedTagIndex, setHighlightedTagIndex] = useState(-1);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const serviceInputRef = useRef<HTMLInputElement>(null);

    const [baseURL, setBaseURL] = useState("http://localhost:6969");

    useEffect(() => {
        const storedURL = typeof window !== "undefined" ? localStorage.getItem("baseURL") : null;
        if (storedURL) {
            setBaseURL(storedURL);
        }
    }, []);

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
            const response = await fetch(`${baseURL}/repository?search=${query}`);
            if (!response.ok) return;
            const data = await response.json();
            const filtered = data.data.filter(
                (repo: Repository) => repo.name.toLowerCase() !== query.toLowerCase()
            );
            setRepositorySuggestions(filtered);
            setShowSuggestions(true);
        } catch (_) {
        }
    };

    const fetchTagSuggestions = async (repoId: number) => {
        try {
            const response = await fetch(`${baseURL}/tag/${repoId}`);
            if (!response.ok) return;
            const data = await response.json();
            setTagSuggestions(data.data);
        } catch (_) {
        }
    };

    const handleServiceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        setSearchTerm(rawValue);
        const formatted = rawValue
            .replace(/[^a-zA-Z0-9 -]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        form.setValue("serviceName", formatted, {shouldValidate: true});
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

    function parseVersion(fieldValue: string) {
        if (!fieldValue) return null;
        const match = fieldValue.match(/^([0-9]+)\.([0-9]+)\.([0-9]+)$/);
        if (!match) return null;
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        const patch = parseInt(match[3], 10);
        return {major, minor, patch};
    }

    const compareVersionValue = (versionStr: string): number | undefined => {
        const version = parseVersion(versionStr);
        if (!version) return undefined;
        return version.major * 10000 + version.minor * 100 + version.patch;
    };

    const handleTagSuggestionClick = (tagItem: Tag) => {
        form.setValue("tag", tagItem.name, {shouldValidate: true});
        setOriginalTag(tagItem.name);
        setShowTagDropdown(false);
    };

    const handleTagManualChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: { onChange: (val: string) => void; value: string }
    ) => {
        const newVal = e.target.value;
        field.onChange(newVal);
        if (!originalTag) return;
        const newValNum = compareVersionValue(newVal);
        const origValNum = compareVersionValue(originalTag);
        if (!newValNum || !origValNum) {
            return;
        }
        if (newValNum < origValNum) {
            field.onChange(originalTag);
        }
    };

    const incrementPatch = (fieldValue: string) => {
        const version = parseVersion(fieldValue);
        if (!version) return fieldValue;
        const {major, minor, patch} = version;
        const newPatch = patch + 1;
        return `${major}.${minor}.${newPatch}`;
    };

    const decrementPatch = (fieldValue: string) => {
        const version = parseVersion(fieldValue);
        if (!version) return fieldValue;
        let patch = version.patch;
        const {major, minor} = version;
        if (patch > 0) {
            patch -= 1;
        }
        const newVersion = `${major}.${minor}.${patch}`;
        const newValNum = compareVersionValue(newVersion);
        const origValNum = originalTag ? compareVersionValue(originalTag) : 0;
        if (origValNum && newValNum && newValNum < origValNum) {
            return originalTag;
        }
        return newVersion;
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
            const chosenTag = tagSuggestions[highlightedTagIndex];
            form.setValue("tag", chosenTag.name, {shouldValidate: true});
            setOriginalTag(chosenTag.name);
            setShowTagDropdown(false);
        } else if (e.key === "Escape") {
            setShowTagDropdown(false);
        }
    };

    const handleTagBlur = () => {
        setTimeout(() => setShowTagDropdown(false), 200);
    };

    const handleFormSubmit = async (values: FormValues) => {
        await onSubmit(values);
        form.reset();
        setSelectedServiceId(null);
        setTagSuggestions([]);
        setOriginalTag("");
        setShowTagDropdown(false);
    };

    return (
        <Card className="shadow-lg hover:shadow-xl transition-shadow h-fit bg-card text-card-foreground">
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
                            <FormField
                                control={form.control}
                                name="serviceName"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2 text-foreground/80">
                                            Service Name
                                            <span className="text-xs text-muted-foreground">
                        (auto-format to lowercase)
                      </span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative" ref={suggestionsRef}>
                                                <Search
                                                    className="absolute left-4 top-[13px] h-5 w-5 text-muted-foreground"/>
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
                                                        className="absolute z-10 w-full mt-2 bg-popover text-popover-foreground border border-border rounded-lg shadow-md overflow-hidden">
                                                        {repositorySuggestions.map((repo, index) => (
                                                            <div
                                                                key={repo.id}
                                                                onMouseDown={() => handleSuggestionClick(repo)}
                                                                className={`px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                                                                    highlightedIndex === index ? "bg-accent generate-text-accent-foreground" : ""
                                                                }`}
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

                            <FormField
                                control={form.control}
                                name="tag"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2 text-foreground/80">
                                            Version Tag
                                            <span className="text-xs text-muted-foreground">
                        (Format: X.X.X)
                      </span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="flex flex-col gap-2">
                                                <div className="relative">
                                                    <Popover
                                                        open={selectedServiceId !== null && showTagDropdown}
                                                        onOpenChange={(open) => {
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
                                                                    field.value !== "" ? "generate-text-foreground" : "generate-text-muted-foreground"
                                                                } ${
                                                                    !selectedServiceId
                                                                        ? "opacity-50 cursor-not-allowed"
                                                                        : ""
                                                                }`}
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
                                                            className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover text-popover-foreground border border-border"
                                                        >
                                                            <div className="max-h-60 overflow-y-auto">
                                                                {tagSuggestions.map((tagItem, index) => (
                                                                    <div
                                                                        key={index}
                                                                        onMouseDown={() => handleTagSuggestionClick(tagItem)}
                                                                        className={`px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                                                                            highlightedTagIndex === index
                                                                                ? "bg-accent generate-text-accent-foreground"
                                                                                : ""
                                                                        }`}
                                                                    >
                                                                        {`${tagItem.env}/${tagItem.name}`}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                                {/*<div className="flex items-center gap-2">*/}
                                                {/*    <Button*/}
                                                {/*        variant="secondary"*/}
                                                {/*        type="button"*/}
                                                {/*        size="sm"*/}
                                                {/*        onClick={() => {*/}
                                                {/*            const updated = decrementPatch(field.value);*/}
                                                {/*            field.onChange(updated);*/}
                                                {/*        }}*/}
                                                {/*        disabled={!field.value}*/}
                                                {/*    >*/}
                                                {/*        -*/}
                                                {/*    </Button>*/}
                                                {/*    <Input*/}
                                                {/*        value={field.value}*/}
                                                {/*        onChange={(e) => handleTagManualChange(e, field)}*/}
                                                {/*        placeholder="X.X.X"*/}
                                                {/*        className="w-[120px]"*/}
                                                {/*        disabled={!selectedServiceId}*/}
                                                {/*    />*/}
                                                {/*    <Button*/}
                                                {/*        variant="secondary"*/}
                                                {/*        type="button"*/}
                                                {/*        size="sm"*/}
                                                {/*        onClick={() => {*/}
                                                {/*            const updated = incrementPatch(field.value);*/}
                                                {/*            const newValNum = compareVersionValue(updated);*/}
                                                {/*            const origValNum = originalTag*/}
                                                {/*                ? compareVersionValue(originalTag)*/}
                                                {/*                : undefined;*/}
                                                {/*            if (newValNum && origValNum && newValNum < origValNum) {*/}
                                                {/*                field.onChange(originalTag);*/}
                                                {/*            } else {*/}
                                                {/*                field.onChange(updated);*/}
                                                {/*            }*/}
                                                {/*        }}*/}
                                                {/*        disabled={!field.value}*/}
                                                {/*    >*/}
                                                {/*        +*/}
                                                {/*    </Button>*/}
                                                {/*</div>*/}
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs"/>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {selectedServiceId
                                                ? `Available versions for service ${selectedServiceId} (Pick +/ - to edit patch, or edit manually)`
                                                : "Select a service first"}
                                        </p>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="mt-4 p-4 bg-secondary flex items-center">
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
                                    setOriginalTag("");
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
                                className="w-full h-12 text-base gap-3 hover:shadow-md transition-shadow dark:text-black text-white"
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

function highlightQuery(text: string, query: string) {
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
}
