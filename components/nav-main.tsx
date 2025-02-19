import {ChevronRight, type LucideIcon} from "lucide-react"
import {SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem} from "@/components/ui/sidebar"
import Link from "next/link"

export function NavMain({items}: {
    items: {
        title: string
        url: string
        icon?: LucideIcon
        isActive?: boolean
    }[]
}) {

    return (
        <SidebarGroup>
            <SidebarMenu className="space-y-3 pe-2 ps-1">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <Link href={item.url} passHref legacyBehavior>
                            <SidebarMenuButton
                                tooltip={item.title}
                                className={`h-14 ${item.isActive && `bg-secondary shadow-[6px_6.4px] drop-shadow border border-primary text-primary font-semibold`}`}>
                                <div>{item.icon && <item.icon/>}</div>
                                <span>{item.title}</span>
                                <ChevronRight
                                    className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                                />
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}