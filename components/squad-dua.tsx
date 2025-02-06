"use client"

import * as React from "react"
import {motion} from "framer-motion"
import {SidebarMenu, SidebarMenuButton, SidebarMenuItem} from "@/components/ui/sidebar"
import {cn} from "@/lib/utils";

export function SquadDua({
                             teams,
                         }: {
    teams: {
        name: string
        logo: React.ElementType
        plan: string
    }[]
}) {
    const [activeTeam, _] = React.useState(teams[0])

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <motion.div whileHover={{ scale: 1.02 }}>
                    <SidebarMenuButton
                        size="lg"
                        className={cn(
                            "group rounded-xl transition-all",
                            "bg-gradient-to-b from-card to-popover/50",
                            "shadow-sm hover:shadow-md",
                            "border hover:border-primary/30"
                        )}
                    >
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                            <activeTeam.logo className="size-4 transition-transform group-hover:scale-110" />
                        </div>

                        <div className="grid flex-1 text-left">
              <span className="truncate font-semibold text-primary">
                {activeTeam.name}
              </span>
                            <span className="truncate text-xs text-muted-foreground">
                {activeTeam.plan}
              </span>
                        </div>
                    </SidebarMenuButton>
                </motion.div>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}