"use client";
import {useEffect, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {ChevronRight, Clipboard, Loader2} from "lucide-react";
import {ToastAction} from "@/components/ui/toast";
import {Badge} from "@/components/ui/badge";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {useToast} from "@/hooks/use-toast";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";

export default function GenerateCurl() {
    const [jsonInput, setJsonInput] = useState("");
    const [curlCommandPretty, setCurlCommandPretty] = useState("");
    const [curlCommandSingleLine, setCurlCommandSingleLine] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isValidJson, setIsValidJson] = useState(true);
    const [wrapLines, setWrapLines] = useState(true);
    const {toast} = useToast();

    useEffect(() => {
        try {
            JSON.parse(jsonInput);
            setIsValidJson(true);
        } catch (_) {
            setIsValidJson(jsonInput.length <= 0);
        }
    }, [jsonInput]);

    const generateCurlCommand = async () => {
        setIsLoading(true);
        try {
            const jsonData = JSON.parse(jsonInput);
            const url = jsonData.fields?.request?.url || "http://localhost:8080";
            const method = jsonData._source?.request?.http_method.toUpperCase() || "POST";
            const contextHeaders = jsonData._source?.context || {};
            const requestHeaders = jsonData.fields?.request?.headers || {};
            const headers = {
                ...Object.fromEntries(
                    Object.entries(contextHeaders).filter(([_, value]) => value !== null && value !== "")
                ),
                ...Object.fromEntries(
                    Object.entries(requestHeaders).filter(([_, value]) => value !== null && value !== "")
                ),
            };
            const body = jsonData._source?.request?.body;

            if (!headers["Content-Type"] && body) {
                headers["Content-Type"] = "application/json";
            }

            let curlCmdPretty = `curl --silent --location --request ${method} '${url}'`;
            Object.entries(headers).forEach(([key, value]) => {
                curlCmdPretty += ` \\\n--header '${key}: ${value}'`;
            });
            if (body) {
                const formattedBody = JSON.stringify(body, null, 2);
                curlCmdPretty += ` \\\n--data '${formattedBody}'`;
            }

            let curlCmdSingleLine = `curl --silent --location --request ${method} '${url}'`;
            Object.entries(headers).forEach(([key, value]) => {
                curlCmdSingleLine += ` --header '${key}: ${value}'`;
            });
            if (body) {
                const formattedBody = JSON.stringify(body);
                curlCmdSingleLine += ` --data '${formattedBody}'`;
            }

            setCurlCommandPretty(curlCmdPretty);
            setCurlCommandSingleLine(curlCmdSingleLine);

            toast({
                title: "cURL generated successfully",
                description: "You can now copy the command in your preferred format",
            });
        } catch (_) {
            toast({
                variant: "destructive",
                title: "Invalid JSON format",
                description: "Please check your JSON input and try again",
                action: <ToastAction altText="Try again">Try again</ToastAction>,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (format : string) => {
        const textToCopy = format === "pretty" ? curlCommandPretty : curlCommandSingleLine;
        navigator.clipboard.writeText(textToCopy);
        toast({
            title: "Copied to clipboard!",
            description: `cURL command (${format === "pretty" ? "formatted" : "single-line"}) is ready to use`,
        });
    };

    return (
        <div className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 py-4 w-full">
            {/* Input Section */}
            <Card className="min-w-0 shadow-lg">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-semibold">JSON Input</CardTitle>
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
                    <div className="relative rounded-lg border bg-background focus-within:ring-2 focus-within:ring-primary">
                        <ScrollArea className="h-fit">
                            <textarea
                                id="json-input"
                                className="w-full h-[490px] p-4 font-mono text-sm bg-transparent resize-none focus:outline-none"
                                placeholder={`{\n  "fields": {\n    "request": {\n      "method": "POST",\n      "url": "https://example.com"\n    }\n  }\n}`}
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                            />
                        </ScrollArea>
                        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground">
                            {jsonInput.split(/\r\n|\r|\n/).length} lines
                        </div>
                    </div>

                    <Button
                        onClick={generateCurlCommand}
                        disabled={!isValidJson || isLoading}
                        className="w-full mt-4 h-12 text-lg shadow-md transition-transform hover:scale-[1.02] dark:text-black text-white"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Crafting cURL...
                            </>
                        ) : (
                            <>
                                Generate cURL
                                <ChevronRight className="ml-2 h-5 w-5" />
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
                            <CardTitle className="text-xl font-semibold">cURL Output</CardTitle>
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
                                <div className="relative rounded-lg bg-foreground/5 p-4 ">
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
                                                    size="icon"
                                                    onClick={() => copyToClipboard(format)}
                                                    className="h-8 w-8 "
                                                >
                                                    <Clipboard className="h-4 w-4 text-white dark:text-black" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Copy {format.replace('-', ' ')} version</p>
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