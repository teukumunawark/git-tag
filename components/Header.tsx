import React from "react";
import {GitPullRequestCreate} from "lucide-react";
import {ModeToggle} from "@/components/mode-toggle";

export const Header: React.FC = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b backdrop-blur">
            <div className="container flex h-20 items-center mx-auto justify-between">
                <div className="flex items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg flex items-center justify-center">
                            <GitPullRequestCreate className="text-xl font-bold"/>
                        </div>
                        <span
                            className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent hidden lg:inline-block">Project Ambisius Squad 2
              <span className="text-sm ml-2 bg-primary/10 text-primary px-2 py-1 rounded-full hidden lg:inline-block">
                v1.0
              </span>
            </span>
                    </div>
                </div>
                <ModeToggle/>
            </div>
        </header>
    );
};
