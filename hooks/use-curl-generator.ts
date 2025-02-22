import {useCallback, useState} from 'react';
import {z} from 'zod';

const requestHeadersSchema = z.object({
    'customer-id': z.string().optional(),
    'client-version': z.string().optional(),
    'screen-id': z.string().optional(),
    'scope': z.string().optional(),
    'enc-session-key': z.string().optional(),
    'client-platform': z.string().optional(),
    'authorization': z.string().optional(),
    'user-agent': z.string().optional(),
    'signature': z.string().optional(),
    'mav-api-key': z.string().optional(),
    'device-id': z.string().optional(),
    'mav-authorization': z.string().optional(),
    'content-type': z.string().optional(),
    'request-id': z.string().optional(),
    'user-id': z.string().optional(),
    'channel-id': z.string().optional(),
    'cc-customer-id': z.string().optional(),
});

const requestSchema = z.object({
    headers: requestHeadersSchema.optional(),
    uri: z.string().optional(),
    http_method: z.string().optional(),
    body: z.unknown().optional(),
});

const sourceSchema = z.object({
    request: requestSchema.optional(),
});

const jsonDataSchema = z.object({
    _source: sourceSchema.optional(),
    fields: z.object({request: z.object({url: z.string().optional()}).optional()}).optional(),
});

type ValidatedJsonData = z.infer<typeof jsonDataSchema>

const useCurlGenerator = () => {
    const [curlCommandPretty, setCurlCommandPretty] = useState('');
    const [curlCommandSingleLine, setCurlCommandSingleLine] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateCurlCommand = useCallback(async (jsonData: unknown) => {
        setIsLoading(true);
        try {
            const {data, error, success} = jsonDataSchema.safeParse(jsonData);
            if (!success) {
                const errorMessages = error.errors.map(error => error.message).join('\n');
                return new Error(`Invalid JSON format:\n${errorMessages}`);
            }

            const {_source} = data as ValidatedJsonData;
            const baseUrl = 'http://localhost:8080';
            const uri = _source?.request?.uri || '/unknown uri';
            const method = _source?.request?.http_method?.toUpperCase() || 'unknown method';
            const headers = _source?.request?.headers || {};
            const body = _source?.request?.body;

            const generateCurl = (pretty: boolean) => {
                let curlCmd = `curl --silent --location --request ${method} '${baseUrl.concat(uri)}'`;
                for (const [key, value] of Object.entries(headers)) {
                    curlCmd += pretty ? ` \\\n--header '${key}: ${value}'` : ` --header '${key}: ${value}'`;
                }
                if (body) {
                    const formattedBody = JSON.stringify(body, null, pretty ? 2 : undefined);
                    curlCmd += pretty ? ` \\\n--data '${formattedBody}'` : ` --data '${formattedBody}'`;
                }
                return curlCmd;
            };

            const curlCmdPretty = generateCurl(true);
            const curlCmdSingleLine = generateCurl(false);

            setCurlCommandPretty(curlCmdPretty);
            setCurlCommandSingleLine(curlCmdSingleLine);
        } catch (error) {
            console.error('Error generating cURL:', error);
            throw error;
        } finally {
            setIsLoading(false);
            setCopied(false);
        }
    }, []);

    const copyToClipboard = (format: string) => {
        const textToCopy = format === 'pretty' ? curlCommandPretty : curlCommandSingleLine;
        navigator
            .clipboard.writeText(textToCopy)
            .then(() => {
                setCopied(true);
            })
            .catch((error) => {
                console.error("Failed to copy:", error);
            });
    };

    return {curlCommandPretty, curlCommandSingleLine, isLoading, copied, generateCurlCommand, copyToClipboard};
};

export default useCurlGenerator;