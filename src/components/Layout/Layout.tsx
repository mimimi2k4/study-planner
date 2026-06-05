import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

const SIDEBAR_W = 240;

export interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-[100dvh] bg-zinc-50">
            <Sidebar 
                width={SIDEBAR_W} 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
            />
            
            <main className="flex-1 min-h-[100dvh] flex flex-col layout-main min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-black text-lg text-slate-900 ml-2">StudyPlanner</span>
                </div>

                <div
                    className="flex-1 w-full px-4 py-6 md:px-12 md:py-8 lg:px-12 mx-auto"
                    style={{ maxWidth: 1400 }}
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
