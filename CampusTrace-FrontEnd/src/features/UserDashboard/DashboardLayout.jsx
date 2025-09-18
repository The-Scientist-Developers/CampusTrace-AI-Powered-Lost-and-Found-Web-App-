import React, { useState } from 'react';
import { supabase } from '../../api/apiClient';
import { ChevronLeft, Home, FileText, Search, Bell, User, LogOut, Plus } from 'lucide-react';
import logo2 from '../../Images/logo2.png'

const menuItems = [
    { label: 'Dashboard', icon: Home },
    { label: 'My Posts', icon: FileText },
    { label: 'Browse All', icon: Search },
    { label: 'Notifications', icon: Bell },
    { label: 'Profile', icon: User },
];

const SidebarLink = ({ item, open }) => (
    <a href="#" className={`flex items-center gap-4 p-3 rounded-lg transition-colors text-sm font-medium ${
        item.label === 'Dashboard' 
        ? 'bg-zinc-800 text-white' 
        : 'text-zinc-400 hover:bg-zinc-800 hover:text-red' 
    }`}>
        <item.icon className="w-5 h-5 flex-shrink-0" />
        <span className={`transition-opacity duration-200 ${!open && 'opacity-0'}`}>
            {item.label}
        </span>
    </a>
);

export default function DashboardLayout({ children, user }) {
    const [open, setOpen] = useState(true);

        const handleLogout = async () => {
            await supabase.auth.signOut();

        };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300 flex font-sans">
            {/* --- Sidebar Navigation --- */}
            <aside className={`relative bg-black border-r border-zinc-800 flex flex-col p-4 transition-all duration-300 ease-in-out ${open ? 'w-64' : 'w-20'}`}>
                
                {/* --- NEW FLOATING COLLAPSE/EXPAND BUTTON --- */}
                <button 
                    onClick={() => setOpen(!open)} 
                    className="absolute -right-3 top-9 z-10 p-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-full hover:bg-zinc-700 hover:text-white transition-colors"
                >
                    <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${!open && 'rotate-180'}`} />
                </button>

                {/* Sidebar Header */}
                <div className="flex items-center h-16 border-b border-zinc-800 mb-4">
                    <div className={`flex items-center gap-3 transition-opacity duration-200 ${!open && 'opacity-0'}`}>
                        <div className="bg-zinc-900 rounded-lg">
                            <img src={logo2} alt="" />
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-grow space-y-2">
                    {menuItems.map((item, index) => (
                        <SidebarLink key={index} item={item} open={open} />
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="border-t border-zinc-800 pt-4">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-3 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <span className={`transition-opacity duration-200 ${!open && 'opacity-0'}`}>
                            Sign Out
                        </span>
                    </button>
                </div>
            </aside>

            {/* --- Main Content Area --- */}
            <div className="flex-grow flex flex-col">
                {/* Top Header Bar */}
                <header className="bg-black/70 backdrop-blur-sm border-b border-zinc-800">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-8">
                        {/* "Post new item" BUTTON */}
                        <button className='flex items-center gap-2 px-4 py-2 bg-red text-white font-semibold text-sm rounded-md hover:bg-blue-700 transition-colors'>
                           <Plus className="w-4 h-4" />
                           Post New Item
                        </button>
                        
                        {/* USER PROFILE SECTION */}
                        <div className="flex items-center gap-3">
                            <img 
                                src={`https://placehold.co/32x32/18181b/ffffff?text=${user?.email?.[0]?.toUpperCase() || 'U'}`} 
                                alt="User Avatar"
                                className="w-8 h-8 rounded-full object-cover border-2 border-zinc-700"
                            />
                            <span className="text-sm font-medium text-zinc-300 hidden sm:block">{user ? user.email : '...'}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-grow p-8 overflow-auto">
                    {React.Children.map(children, child =>
                        React.cloneElement(child, { user: user })
                    )}
                </main>
            </div>
        </div>
    );
}