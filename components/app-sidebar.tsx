"use client"

import * as React from "react"
import {usePathname} from "next/navigation"
import {CurlyBraces, GitPullRequestCreate, Home, SquareTerminal} from "lucide-react"

import {NavMain} from "@/components/nav-main"
import {Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail} from "@/components/ui/sidebar"
import {SquadDua} from "@/components/squad-dua"
import {ModeToggle} from "@/components/mode-toggle";

const data = {
    teams: [
        {
            name: "Squad 2",
            logo: GitPullRequestCreate,
            plan: "Project Ambisius",
        }
    ],
    navMain: [
        {
            title: "Home",
            url: "/",
            icon: Home,
        },
        {
            title: "Generate File .txt",
            url: "/generate-text",
            icon: SquareTerminal,
        },
        {
            title: "Generate cURL",
            url: "/generate-curl",
            icon: CurlyBraces,
        }
    ]
}

export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();

    console.log(pathname)

    return (
        <Sidebar collapsible="icon" {...props} variant="floating">
            <SidebarHeader>
                <SquadDua teams={data.teams}/>
            </SidebarHeader>
            <SidebarContent className="me-2">
                <NavMain items={data.navMain.map(item => ({
                    ...item,
                    isActive: pathname === item.url,
                }))}/>
            </SidebarContent>
            <SidebarFooter>
                <ModeToggle/>
            </SidebarFooter>
            <SidebarRail/>
        </Sidebar>
    )
}
