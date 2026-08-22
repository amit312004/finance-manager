import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Receipt, LayoutDashboard, Receipt as ReceiptIcon, PieChart, Wallet, ScanLine, Settings, Menu, X, LogOut, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function Sidebar({ isOpen, setIsOpen }) {
    const location = useLocation();

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: "Overview", path: "/dashboard" },
        { icon: <Activity size={20} />, label: "Health Score", path: "/health-score" },
        { icon: <ReceiptIcon size={20} />, label: "Transactions", path: "/transactions" },
        { icon: <PieChart size={20} />, label: "Reports", path: "/analytics" },
        { icon: <Wallet size={20} />, label: "Budgets", path: "/budgets" },
        { icon: <ScanLine size={20} />, label: "AI Scan", path: "/scanner" },
        { icon: <Settings size={20} />, label: "Settings", path: "/settings" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity" onClick={() => setIsOpen(false)} />
            )}

            {/* Sidebar */}
            <div className={`
              fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 w-64 transform transition-all duration-300 ease-in-out z-50 flex flex-col shadow-2xl
              ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
           `}>
                <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/30">
                            <Receipt className="h-6 w-6 text-slate-900 dark:text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Finora</span>
                    </div>
                    <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    <p className="px-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Main Menu</p>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-indigo-500/10 text-indigo-400'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-100'
                                    }`}
                            >
                                <span className={`${isActive ? 'text-indigo-400' : 'text-slate-400 dark:text-slate-400 group-hover:text-indigo-400'} transition-colors duration-200`}>
                                    {item.icon}
                                </span>
                                {item.label}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </>
    )
}

function Header({ toggleSidebar }) {
    const { user, logout } = useAuth();

    return (
        <header className="bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-30 transition-all duration-200">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Menu size={20} />
                </button>
                <div className="hidden md:block">
                    <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200">
                        Welcome back, <span className="font-semibold text-indigo-400">{user?.name || 'User'}</span>
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 pl-1 pr-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 shadow-sm">
                    <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-slate-900 dark:text-white font-bold shadow-inner">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:block">{user?.name || 'User'}</span>
                </div>
                <button
                    onClick={logout}
                    className="p-2 text-slate-400 dark:text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all duration-200"
                    title="Sign out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    )
}

export default function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex selection:bg-indigo-500/30 selection:text-indigo-200">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen relative w-full lg:w-[calc(100%-16rem)] max-w-full">
                <Header toggleSidebar={() => setIsSidebarOpen(true)} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto scroll-smooth">
                    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
