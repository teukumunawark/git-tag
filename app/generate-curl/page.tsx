"use client";
import {useEffect, useMemo, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {ChevronRight, Clipboard, ClipboardCheck, Loader2} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {useToast} from "@/hooks/use-toast";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import useCurlGenerator from "@/hooks/use-curl-generator";


export default function GenerateCurl() {
    const [jsonInput, setJsonInput] = useState('');
    const [isValidJson, setIsValidJson] = useState(true);
    const [wrapLines, setWrapLines] = useState(true);
    const [curlGenerated, setCurlGenerated] = useState(false);
    const {toast} = useToast();
    const {
        curlCommandPretty,
        curlCommandSingleLine,
        isLoading,
        copied,
        generateCurlCommand,
        copyToClipboard,
    } = useCurlGenerator();

    const isValidJsonInput = useMemo(() => (input: string): boolean => {
        if (!input) return true;
        try {
            JSON.parse(input);
            return true;
        } catch (_) {
            return false;
        }
    }, []);

    useEffect(() => {
        setIsValidJson(isValidJsonInput(jsonInput));
        if (!isValidJsonInput(jsonInput)) {
            setCurlGenerated(false);
        }
    }, [jsonInput, isValidJsonInput]);

    const handleSubmit = async () => {
        try {
            const jsonData = JSON.parse(jsonInput);
            await generateCurlCommand(jsonData);
            toast({
                title: "cURL generated successfully",
                description: "You can now copy the command in your preferred format",
            });
            setCurlGenerated(true);
        } catch (_) {
            toast({
                variant: 'destructive',
                title: 'Invalid JSON',
                description: 'Please check your JSON input.',
            });
            setCurlGenerated(false);
        }
    };

    return (
        <div className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 py-4 w-full">
            {/* Input Section */}
            <Card className="min-w-0 shadow-lg">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-semibold">JSON INPUT</CardTitle>
                            <Label className="text-sm text-muted-foreground">
                                Paste your JSON data below
                            </Label>
                        </div>
                        <Badge
                            variant={isValidJson ? "outline" : "destructive"}
                            className={`text-xs transition-colors ${
                                !isValidJson && "animate-pulse"
                            }`}
                        >
                            {isValidJson ? "✓ Valid JSON" : "✗ Invalid JSON"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div
                        className="relative rounded-lg border bg-background focus-within:ring-2 focus-within:ring-primary">
                        <ScrollArea className="h-fit">
                            <textarea
                                id="json-input"
                                className="w-full h-[490px] p-4 font-mono text-sm bg-transparent resize-none focus:outline-none"
                                placeholder={`{\n  "fields": {\n    "request": {\n      "method": "POST",\n      "url": "https://example.com"\n    }\n  }\n}`}
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                            />
                        </ScrollArea>
                        <div
                            className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground">
                            {jsonInput.split(/\r\n|\r|\n/).length} lines
                        </div>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={!jsonInput || !isValidJson || isLoading}
                        className="w-full mt-4 h-12 text-lg shadow-md transition-all duration-200 hover:scale- text-secondary
                        hover:bg-secondary hover:text-foreground hover:shadow-[6px_6.9px] hover:border-primary hover:border"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                                Crafting cURL...
                            </>
                        ) : (
                            <>
                                Generate cURL
                                <ChevronRight className="ml-2 h-5 w-5"/>
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Output Section */}
            <Card className="min-w-0 shadow-lg">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-semibold">CURL OUTPUT</CardTitle>
                            <Label className="text-sm text-muted-foreground">
                                Ready-to-use command in multiple formats
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Label className="text-xs">Wrap Lines</Label>
                            <Switch
                                checked={wrapLines}
                                onCheckedChange={setWrapLines}
                                className="scale-90"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="pretty" className="space-y-4">
                        <TabsList className="grid grid-cols-2 w-[240px]">
                            <TabsTrigger value="pretty">
                                <span className="mr-2">🌿</span> Formatted
                            </TabsTrigger>
                            <TabsTrigger value="single-line">
                                <span className="mr-2">➖</span> Single Line
                            </TabsTrigger>
                        </TabsList>

                        {['pretty', 'single-line'].map((format) => (
                            <TabsContent key={format} value={format}>
                                <div className="relative rounded-lg bg-foreground/5 p-4 bg-red">
                                    <ScrollArea
                                        className={`h-[390px] ${wrapLines ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}
                                    >
                                        <code className="font-mono text-sm">
                                            {format === 'pretty' ? curlCommandPretty : curlCommandSingleLine || (
                                                <span className="text-muted-foreground">
                                                    Your cURL command will appear here...
                                                </span>
                                            )}
                                        </code>
                                    </ScrollArea>

                                    <div className="absolute top-3 right-3 flex space-x-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="default"
                                                    size="default"
                                                    onClick={() => copyToClipboard(format)}
                                                    className={`h-10 w-10 transition-colors duration-300`}
                                                    disabled={!curlGenerated}
                                                >
                                                    {copied && curlGenerated ? (
                                                        <ClipboardCheck
                                                            className="min-h-5 min-w-5 text-green-500 transition-transform duration-200"
                                                            style={{strokeWidth: '2.5'}}/>
                                                    ) : (
                                                        <Clipboard className="min-h-5 min-w-5 text-secondary"/>
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-secondary">Copy {format.replace('-', ' ')} version</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>

                    <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-sm text-primary/80 flex items-center">
                            <span className="mr-2">💡</span>
                            Pro Tip: Use the formatted version for readability and single-line for quick pasting!
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}