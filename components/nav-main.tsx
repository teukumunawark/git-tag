"use client"

import {useRouter} from "next/navigation"
import {ChevronRight, type LucideIcon} from "lucide-react"
import {cn} from "@/lib/utils"
import {motion} from "framer-motion"
import {SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem} from "@/components/ui/sidebar"

export function NavMain({
                            items,
                        }: {
    items: {
        title: string
        url: string
        icon?: LucideIcon
        isActive?: boolean
    }[]
}) {
    const router = useRouter()

    return (
        <SidebarGroup className="pt-5">
            <SidebarMenu className="space-y-2">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <motion.div
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                            className="relative"
                        >
                            <SidebarMenuButton
                                tooltip={item.title}
                                onClick={() => router.push(item.url)}
                                className={cn(
                                    "flex items-center h-12 gap-3 px-2 rounded-[8px] transition-all duration-200 cursor-pointer",
                                    "hover:bg-accent/50",
                                    item.isActive
                                        ? "bg-primary/10 text-primary font-semibold shadow-[5px_6px]"
                                        : "text-muted-foreground hover:text-foreground hover:shadow-[3px_4px]"
                                )}
                            >
                                {item.icon && (
                                    <item.icon className={cn(
                                        "min-w-5 min-h-5 transition-colors",
                                        item.isActive ? "text-primary" : "text-muted-foreground"
                                    )}/>
                                )}

                                <span className="truncate">{item.title}</span>

                                {item.isActive && (
                                    <motion.div
                                        initial={{opacity: 0, x: -10}}
                                        animate={{opacity: 1, x: 0}}
                                        className="ml-auto"
                                    >
                                        <ChevronRight className="h-4 w-4 text-primary"/>
                                    </motion.div>
                                )}
                            </SidebarMenuButton>

                            {item.isActive && (
                                <motion.div
                                    className="absolute inset-0 bg-primary/10 rounded-lg"
                                    layoutId="activeMenuItem"
                                    transition={{type: "spring", stiffness: 300, damping: 30}}
                                />
                            )}
                        </motion.div>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}