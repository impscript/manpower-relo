'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, FileText, Settings, LogOut, ChevronLeft, Menu, ArrowRightLeft } from 'lucide-react'
import clsx from 'clsx'

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    return (
        <div
            className={clsx(
                "h-screen bg-gray-900 text-white flex flex-col transition-all duration-300 relative shadow-xl z-50 flex-shrink-0 sticky top-0",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Header & Toggle */}
            <div className="p-4 flex items-center justify-between border-b border-gray-800 h-16">
                <div className={clsx("overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent whitespace-nowrap">
                        Manpower.AI
                    </h1>
                </div>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition"
                >
                    {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="flex-1 px-3 space-y-2 mt-4">
                <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" href="/" collapsed={isCollapsed} active={isActive('/')} />
                <SidebarItem icon={<Users size={20} />} label="Employees" href="/employees" collapsed={isCollapsed} active={isActive('/employees')} />
                <SidebarItem icon={<ArrowRightLeft size={20} />} label="Movements" href="/movements" collapsed={isCollapsed} active={isActive('/movements')} />
                <SidebarItem icon={<FileText size={20} />} label="Reports" href="/reports" collapsed={isCollapsed} active={isActive('/reports')} />
                <SidebarItem icon={<Settings size={20} />} label="Settings" href="/settings" collapsed={isCollapsed} active={isActive('/settings')} />
            </nav>

            <div className="p-3 border-t border-gray-800">
                <button className={clsx(
                    "flex items-center gap-3 px-3 py-3 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-xl w-full transition group",
                    isCollapsed ? "justify-center" : ""
                )}>
                    <LogOut size={20} />
                    <span className={clsx("font-medium transition-all duration-300 overflow-hidden whitespace-nowrap", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>Sign Out</span>
                </button>
            </div>
        </div>
    )
}

function SidebarItem({ icon, label, href, collapsed, active }: { icon: any, label: string, href: string, collapsed: boolean, active?: boolean }) {
    return (
        <Link
            href={href}
            className={clsx(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                active ? "bg-blue-600/10 text-blue-400" : "text-gray-400 hover:bg-gray-800 hover:text-white",
                collapsed ? "justify-center" : ""
            )}
        >
            <div className="flex-shrink-0">{icon}</div>
            <span className={clsx(
                "font-medium transition-all duration-300 overflow-hidden whitespace-nowrap",
                collapsed ? "w-0 opacity-0 absolute" : "w-auto opacity-100"
            )}>
                {label}
            </span>

            {/* Tooltip for collapsed state */}
            {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-gray-700 transition-opacity">
                    {label}
                </div>
            )}
        </Link>
    )
}
