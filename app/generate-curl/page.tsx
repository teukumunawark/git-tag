"use client";
import {useEffect, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {Clipboard, Loader2} from "lucide-react";
import {ToastAction} from "@/components/ui/toast";
import {Badge} from "@/components/ui/badge";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {useToast} from "@/hooks/use-toast";
import {ScrollArea} from "@/components/ui/scroll-area";

export default function GenerateCurl() {
    const [jsonInput, setJsonInput] = useState("");
    const [curlCommand, setCurlCommand] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isValidJson, setIsValidJson] = useState(true);
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
            const method = jsonData.fields?.request?.method?.toUpperCase() || "POST";

            const contextHeaders = jsonData._source?.context || {};
            const requestHeaders = jsonData.fields?.request?.headers || {};

            const headers = {
                ...Object.fromEntries(
                    Object.entries(contextHeaders).filter(([_, value]) => value !== "")
                ),
                ...requestHeaders,
            };

            const body = jsonData.fields?.request?.body?.[0]?.data;

            let curlCmd = `curl --silent --location --request ${method} '${url}'`;

            Object.entries(headers).forEach(([key, value]) => {
                curlCmd += ` \\\n--header '${key}: ${value}'`;
            });

            if (body) {
                const formattedBody = JSON.stringify(body, null, 2);
                curlCmd += ` \\\n--data '${formattedBody}'`;
            }

            setCurlCommand(curlCmd);

            toast({
                title: "cURL generated successfully",
                description: "You can now copy the command to clipboard",
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

    const copyToClipboard = () => {
        navigator.clipboard.writeText(curlCommand);
        toast({
            title: "Copied to clipboard!",
            description: "cURL command is ready to use",
        });
    };

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 w-full">
            {/* Input Section */}
            <Card className="min-w-0">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>JSON Input</CardTitle>
                        <Badge className={`text-xs font-semibold py-2 ${isValidJson ? "bg-green-400" : "bg-red-500"}`} variant={isValidJson ? "default" : "destructive"}>
                            {isValidJson ? "Valid JSON" : "Invalid JSON"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <ScrollArea className="min-h-fit rounded-md border bg-muted overflow-hidden">
                            <Textarea
                                id="json-input"
                                className="h-96 font-mono text-sm w-full max-w-full resize-none"
                                placeholder={`Example:\n{\n  "fields": {\n    "request": {\n      "method": "POST",\n      "url": "https://example.com"\n    }\n  }\n}`}
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                            />
                        </ScrollArea>
                    </div>
                    <Button
                        onClick={generateCurlCommand}
                        disabled={!isValidJson || isLoading}
                        className="w-full"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Generating..." : "Generate cURL"}
                    </Button>
                </CardContent>
            </Card>

            {/* Output Section */}
            <Card className="min-w-0">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>cURL Output</CardTitle>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={copyToClipboard}
                                    disabled={!curlCommand}
                                >
                                    <Clipboard className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy to clipboard</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="relative rounded-md bg-gray-900 dark:bg-slate-800 p-4 h-96 overflow-x-auto w-full max-w-full">
                        <code className="text-sm text-white font-mono block whitespace-pre-wrap break-words w-full max-w-full">
                            {curlCommand || (
                                <span className="text-gray-400">Your cURL command will appear here...</span>
                            )}
                        </code>
                        {curlCommand && (
                            <div className="absolute top-2 right-2">
                                <Badge variant="secondary" className="text-xs">
                                    {curlCommand.split(' ')[3]} {/* Menampilkan method */}
                                </Badge>
                            </div>
                        )}
                    </ScrollArea>
                    <div className="mt-4 text-sm text-muted-foreground">
                        Tips: You can modify the command directly before copying
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}