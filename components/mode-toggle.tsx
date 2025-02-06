"use client"

import * as React from "react"
import {Monitor, Moon, Sun} from "lucide-react"
import {useTheme} from "next-themes"
import {motion} from "framer-motion"
import {cn} from "@/lib/utils"
import {useSidebar} from "@/components/ui/sidebar"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import {Button} from "@/components/ui/button"

export function ModeToggle() {
    const {theme, setTheme} = useTheme()
    const {open} = useSidebar()
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <DropdownMenu onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size={open ? "icon" : "default"}
                    aria-label="Toggle Theme"
                    className={cn(
                        "group w-full gap-3 rounded-lg px-3 transition-all",
                        "hover:bg-accent/50 hover:shadow-sm",
                        "data-[state=open]:bg-accent/70",
                        open ? "h-12 w-full justify-start" : "h-14 px-4"
                    )}
                >
                    {/* Animated Theme Icons */}
                    <motion.div
                        key={theme}
                        initial={{opacity: 0, scale: 0.8}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.8}}
                        transition={{type: "spring", stiffness: 200, damping: 20}}
                        className="relative flex items-center"
                    >
                        {theme === "light" && <Sun className="h-5 w-5 text-yellow-500"/>}
                        {theme === "dark" && <Moon className="h-5 w-5 text-indigo-400"/>}
                        {theme === "system" && <Monitor className="h-5 w-5 text-emerald-500"/>}
                    </motion.div>

                    {open && (
                        <motion.div
                            initial={{opacity: 0, x: -10}}
                            animate={{opacity: 1, x: 0}}
                            exit={{opacity: 0, x: -10}}
                            className="flex flex-1 items-center justify-between"
                        >
                            <span className="text-sm">Theme</span>
                            <span className="text-xs text-muted-foreground">{theme
                                ? theme.charAt(0).toUpperCase() + theme.slice(1)
                                : "System"}
                            </span>
                        </motion.div>
                    )}
                </Button>
            </DropdownMenuTrigger>

            {/* Dropdown Content */}
            <DropdownMenuContent
                align={open ? "end" : "start"}
                className={cn(
                    "min-w-[200px] rounded-lg p-2 shadow-xl",
                    "bg-background/95 backdrop-blur-md",
                    "border border-primary/20",
                    "transition-all duration-200",
                    isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
                )}
            >
                {/* Light Mode */}
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2",
                        "transition-colors hover:bg-primary/10",
                        theme === "light" && "bg-primary/20"
                    )}
                >
                    <Sun className="h-4 w-4 text-yellow-500"/>
                    <div className="flex-1">
                        <p className="font-medium">Light</p>
                        <p className="text-xs text-muted-foreground">For bright environments</p>
                    </div>
                </DropdownMenuItem>

                {/* Dark Mode */}
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2",
                        "transition-colors hover:bg-primary/10",
                        theme === "dark" && "bg-primary/20"
                    )}
                >
                    <Moon className="h-4 w-4 text-indigo-400"/>
                    <div className="flex-1">
                        <p className="font-medium">Dark</p>
                        <p className="text-xs text-muted-foreground">For low light conditions</p>
                    </div>
                </DropdownMenuItem>

                {/* System Mode */}
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2",
                        "transition-colors hover:bg-primary/10",
                        theme === "system" && "bg-primary/20"
                    )}
                >
                    <Monitor className="h-4 w-4 text-emerald-500"/>
                    <div className="flex-1">
                        <p className="font-medium">System</p>
                        <p className="text-xs text-muted-foreground">Match system settings</p>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
