"use client"

import {useRouter} from "next/navigation"
import {ChevronRight, type LucideIcon} from "lucide-react"

import {Collapsible} from "@/components/ui/collapsible"
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
    const router = useRouter();

    return (
        <SidebarGroup>
            <SidebarMenu>
                {items.map((item) => (
                    <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={item.isActive}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                tooltip={item.title}
                                onClick={() => router.push(item.url)}
                                className="flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200 cursor-pointer"
                            >
                                {item.icon && <item.icon
                                    className={`w-5 h-5 ${item.isActive ? "generate-text-white" : "generate-text-gray-500"}`}/>}
                                <span>{item.title}</span>
                                {/*<ChevronRight className="ml-auto transition-transform duration-200"/>*/}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </Collapsible>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}
