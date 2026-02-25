'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Building2,
    List,
    Bookmark,
    Search,
    Sparkles,
} from 'lucide-react';

const navItems = [
    { href: '/companies', label: 'Companies', icon: Building2 },
    { href: '/lists', label: 'Lists', icon: List },
    { href: '/saved', label: 'Saved Searches', icon: Bookmark },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-40">
            {/* Logo */}
            <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-100">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h1 className="text-base font-bold text-gray-900 tracking-tight">Scout AI</h1>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">VC Intelligence</p>
                </div>
            </div>

            {/* Search shortcut hint */}
            <div className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-gray-400 text-sm cursor-pointer hover:bg-gray-100 transition-colors">
                    <Search className="w-4 h-4" />
                    <span>Search...</span>
                    <kbd className="ml-auto text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-400">⌘K</kbd>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2 space-y-1">
                <p className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Navigation</p>
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                        VC
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">Demo User</p>
                        <p className="text-xs text-gray-400">Free Tier</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
