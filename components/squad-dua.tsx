"use client"

import * as React from "react"
import {SidebarMenu, SidebarMenuButton, SidebarMenuItem,} from "@/components/ui/sidebar"

export function SquadDua({
                                 teams,
                             }: {
    teams: {
        name: string
        logo: React.ElementType
        plan: string
    }[]
}) {
    // const {isMobile} = useSidebar()
    const [activeTeam, _] = React.useState(teams[0])

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                    <div
                        className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <activeTeam.logo className="size-4"/>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight"><span
                        className="truncate font-semibold">{activeTeam.name}</span>
                        <span className="truncate text-xs">{activeTeam.plan}</span>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
