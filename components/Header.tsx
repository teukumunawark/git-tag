import React, { useEffect, useState } from "react";
import { GitPullRequestCreate, Loader2, CheckCircle2 } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export const Header: React.FC = () => {
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
        <header className="sticky top-0 z-50 w-full border-b backdrop-blur">
            <div className="container flex h-20 items-center mx-auto justify-between">
                <div className="flex items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg flex items-center justify-center">
                            <GitPullRequestCreate className="text-xl font-bold" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent hidden lg:inline-block">
              Project Ambisius Squad 2
              <span className="text-sm ml-2 bg-primary/10 text-primary px-2 py-1 rounded-full hidden lg:inline-block">
                v1.0
              </span>
            </span>
                    </div>
                </div>
                <div className="flex gap-4">
                    {!onboard && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setErrorMsg("");
                                setSuccessMsg("");
                                setForceOpenSettings(false);
                                setShowSettings(true);
                            }}
                            className="flex items-center gap-1"
                        >
                            Settings
                        </Button>
                    )}
                    <ModeToggle />
                </div>
            </div>

            {onboard ? (
                <Dialog open>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Base URL Settings</DialogTitle>
                            <DialogDescription>
                                Please connect to your backend server.
                            </DialogDescription>
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
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {errorMsg}
                                </motion.p>
                            )}
                            {successMsg && (
                                <motion.p
                                    className="flex items-center text-sm text-green-500 mt-1"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    {successMsg}
                                </motion.p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleTestConnection}
                                disabled={!baseURL.trim() || isTesting}
                                className="w-full justify-center"
                            >
                                {isTesting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    "Test Connection"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ) : (
                <Dialog
                    open={showSettings}
                    onOpenChange={(val) => {
                        if (!forceOpenSettings) {
                            setShowSettings(val);
                        } else {
                            // cannot close
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Base URL Settings</DialogTitle>
                            <DialogDescription>
                                Enter the URL for your backend API.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-muted-foreground" htmlFor="baseURL2">
                                Base URL
                            </label>
                            <Input
                                id="baseURL2"
                                placeholder="http://localhost:8080"
                                value={baseURL}
                                onChange={(e) => {
                                    setBaseURL(e.target.value);
                                    setErrorMsg("");
                                    setSuccessMsg("");
                                }}
                            />
                            {errorMsg && (
                                <motion.p
                                    className="text-sm text-red-500 mt-1"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {errorMsg}
                                </motion.p>
                            )}
                            {successMsg && (
                                <motion.p
                                    className="flex items-center text-sm text-green-500 mt-1"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    {successMsg}
                                </motion.p>
                            )}
                        </div>
                        <DialogFooter>
                            {!forceOpenSettings && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowSettings(false);
                                        setErrorMsg("");
                                        setSuccessMsg("");
                                    }}
                                >
                                    Close
                                </Button>
                            )}
                            <Button
                                onClick={handleTestConnection}
                                disabled={!baseURL.trim() || isTesting}
                            >
                                {isTesting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    "Test Connection"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </header>
    );
};
