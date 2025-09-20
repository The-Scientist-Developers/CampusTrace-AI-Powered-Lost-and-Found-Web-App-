

import React, { useState } from "react";
import {
  Home,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronLeft,
} from "lucide-react";

const menuItems = [
    { href: "#", label: "Overview", icon: Home },
    { href: "#", label: "Post Moderation", icon: ShieldCheck },
    { href: "#", label: "User Management", icon: Users },
    { href: "#", label: "Settings", icon: Settings },
];

const SidebarLink = ({ item, isOpen }) => (
    <a
        href={item.href}
        className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
            item.label === 'Overview' 
            ? 'bg-zinc-800 text-white' 
            : 'text-zinc-400 hover:bg-zinc-800 hover:text-red'
        }`}
    >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        <span className={`ml-3 transition-opacity duration-200 ${!isOpen && "opacity-0 pointer-events-none"}`}>
            {item.label}
        </span>
    </a>
);


const AdminDashboardLayout = ({ children, user, onNavigateToOut}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-300 font-sans">
      
      {/* --- Sidebar --- */}
      <aside className={
        `relative bg-black flex flex-col transition-all duration-300 ease-in-out border-r border-zinc-800 
        ${isSidebarOpen ? "w-64" : "w-20"}`
      }>
        
        {/* Floating Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-9 z-10 p-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-full hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${!isSidebarOpen && "rotate-180"}`} />
        </button>

        {/* Logo/Header */}
        <div className="flex items-center h-[65px] px-6 border-b border-zinc-800">
          <ShieldCheck className="w-8 h-8 text-blue-500" />
          <span className={`ml-3 text-xl font-bold text-white transition-opacity duration-200 ${!isSidebarOpen && "opacity-0 pointer-events-none"}`}>
            Admin
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map(item => (
                <SidebarLink key={item.label} item={item} isOpen={isSidebarOpen} />
            ))}
        </nav>

        {/* Footer / Sign Out */}
        <div className="px-4 py-4 border-t border-zinc-800">
          <button className="flex items-center w-full px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-red transition-colors"
            onClick={onNavigateToOut}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`ml-3 transition-opacity duration-200 ${!isSidebarOpen && "opacity-0 pointer-events-none"}`}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Bar - Styled like the user dashboard header */}
        <header className="flex justify-between items-center h-[65px] px-6 bg-black/70 backdrop-blur-sm border-b border-zinc-800">
          <h1 className="text-xl font-semibold text-white">Overview</h1> {/* This could be dynamic later */}
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold border border-zinc-700">
                    {user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="hidden sm:inline text-zinc-300">{user?.email || "Admin"}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
            {children}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;