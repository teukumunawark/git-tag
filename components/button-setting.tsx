import {CheckCircle2, Loader2, MonitorCheck, Settings} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import React, {useEffect, useState} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {motion} from "framer-motion";
import {Button} from "@/components/ui/button";


export function ButtonSetting() {
    const [showSettings, setShowSettings] = useState(false);
    const [baseURL, setBaseURL] = useState("");
    const [onboard, setOnboard] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [isTesting, setIsTesting] = useState(false);
    const [forceOpenSettings, setForceOpenSettings] = useState(false);

    useEffect(() => {
        const storedURL = localStorage.getItem("baseURL");
        if (!storedURL) {
            setOnboard(true);
            setShowSettings(true);
        } else {
            setBaseURL(storedURL);
        }
    }, []);

    useEffect(() => {
        if (!onboard && baseURL) {
            silentPingCheck(baseURL);
        }
    }, [onboard, baseURL]);

    async function silentPingCheck(url: string) {
        try {
            const res = await fetch(`${url.trim()}/ping`);
            if (!res.ok) {
                setErrorMsg("Connection lost, please update your server address.");
                setForceOpenSettings(true);
                setShowSettings(true);
            }
        } catch (_) {
            setErrorMsg("Connection lost, please update your server address.");
            setForceOpenSettings(true);
            setShowSettings(true);
        }
    }

    const handleTestConnection = async () => {
        if (!baseURL.trim()) return;
        setErrorMsg("");
        setSuccessMsg("");
        setIsTesting(true);
        try {
            const res = await fetch(`${baseURL.trim()}/ping`);
            if (!res.ok) {
                setErrorMsg("Connection failed. Please check your server.");
            } else {
                setSuccessMsg("Connected successfully!");
                localStorage.setItem("baseURL", baseURL.trim());
                setOnboard(false);
                setForceOpenSettings(false);
                setTimeout(() => {
                    setShowSettings(false);
                }, 1500);
            }
        } catch (_) {
            setErrorMsg("Connection failed. Please check your server.");
        } finally {
            setIsTesting(false);
        }
    };


    return (
        <div>
            {!onboard && (
                <Badge
                    variant="outline"
                    onClick={() => {
                        setErrorMsg("");
                        setSuccessMsg("");
                        setForceOpenSettings(false);
                        setShowSettings(true);
                    }}
                    className="py-2 text-secondary cursor-pointer"
                >
                    {!onboard ? <MonitorCheck className="text-green-500"/> : <Settings className="text-secondary"/>}
                </Badge>
            )}

            <BaseUrlDialog
                open={onboard ? true : showSettings}
                onOpenChange={onboard ? undefined : (val: boolean) => !forceOpenSettings && setShowSettings(val)}
                title="Base URL Settings"
                description={onboard ? "Please connect to your backend server." : "Enter the URL for your backend API."}
                showCloseButton={!onboard && !forceOpenSettings}
                onClose={() => {
                    setShowSettings(false);
                    setErrorMsg("");
                    setSuccessMsg("");
                }}
                baseURL={baseURL}
                setBaseURL={setBaseURL}
                errorMsg={errorMsg}
                successMsg={successMsg}
                isTesting={isTesting}
                onTestConnection={handleTestConnection}
            />
        </div>
    );
}

const BaseUrlDialog: React.FC<BaseUrlDialogProps> = ({
                                                         open,
                                                         onOpenChange,
                                                         title,
                                                         description,
                                                         showCloseButton,
                                                         onClose,
                                                         baseURL,
                                                         setBaseURL,
                                                         errorMsg,
                                                         successMsg,
                                                         isTesting,
                                                         onTestConnection,
                                                     }) =>
    (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-muted-foreground" htmlFor="baseURL">
                        Base URL
                    </label>
                    <Input
                        id="baseURL"
                        placeholder="http://localhost:8080"
                        value={baseURL}
                        onChange={(e) => setBaseURL(e.target.value)}
                    />

                    {errorMsg && (
                        <motion.p
                            className="text-sm text-red-500 mt-1"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                        >
                            {errorMsg}
                        </motion.p>
                    )}

                    {successMsg && (
                        <motion.p
                            className="flex items-center text-sm text-green-500 mt-1"
                            initial={{scale: 0.9, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4"/>
                            {successMsg}
                        </motion.p>
                    )}
                </div>

                <DialogFooter>
                    {showCloseButton && (
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    )}
                    <Button
                        onClick={onTestConnection}
                        disabled={!baseURL.trim() || isTesting}
                        className={showCloseButton ? "text-secondary" : "w-full justify-center text-secondary"}
                    >
                        {isTesting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                Connecting...
                            </>
                        ) : (
                            "Test Connection"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

interface BaseUrlDialogProps {
    open: boolean;
    onOpenChange?: (val: boolean) => void;
    title: string;
    description: string;
    showCloseButton: boolean;
    onClose: () => void;
    baseURL: string;
    setBaseURL: (value: string) => void;
    errorMsg: string;
    successMsg: string;
    isTesting: boolean;
    onTestConnection: () => void;
}