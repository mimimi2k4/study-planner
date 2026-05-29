import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Clock,
    Calendar,
    CheckSquare,
    Sparkles,
    GraduationCap,
} from "lucide-react";

const NAV = [
    { to: "/", icon: LayoutDashboard, label: "Tổng quan" },
    { to: "/exams", icon: BookOpen, label: "Môn thi" },
    { to: "/syllabus", icon: FileText, label: "Đề cương" },
    { to: "/timeslots", icon: Clock, label: "Giờ học" },
    { to: "/schedule", icon: Calendar, label: "Lịch học" },
    { to: "/tasks", icon: CheckSquare, label: "Nhiệm vụ" },
];

export interface SidebarProps {
    width: number;
}

export default function Sidebar({ width }: SidebarProps) {
    return (
        <aside
            className="fixed left-0 top-0 h-screen flex flex-col z-50 bg-white border-r border-slate-200"
            style={{ width }}
        >
            {/* Logo */}
            <div className="relative z-10 flex items-center gap-3 px-5 pt-6 pb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500 text-white shrink-0 shadow-sm">
                    <GraduationCap size={20} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                    <p className="text-slate-900 font-black text-[17px] leading-none truncate">
                        StudyPlanner
                    </p>
                    <p className="text-[11px] font-medium mt-1 truncate text-slate-500">
                        Ôn thi thông minh
                    </p>
                </div>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-slate-100 mb-3" />

            {/* Nav */}
            <nav className="relative z-10 flex-1 px-3 py-2 space-y-1 overflow-y-auto">
                {NAV.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === "/"}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-[14px] transition-all duration-150 ${
                                isActive
                                    ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                                <span className={`truncate ${isActive ? "font-bold" : ""}`}>
                                    {label}
                                </span>
                                {isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Motivational card */}
            <div className="mx-3 mb-4">
                <div className="rounded-2xl px-4 py-3 bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles size={12} className="text-emerald-600" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            Động lực hôm nay
                        </p>
                    </div>
                    <p className="text-emerald-900/80 text-[12px] leading-relaxed font-medium">
                        Mỗi phút ôn bài là một bước gần hơn đến thành công!
                    </p>
                </div>
            </div>

            {/* User */}
            <div className="px-4 py-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black bg-slate-100 text-slate-700">
                        H
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-slate-700 text-[13px] truncate font-bold">
                            Hạ
                        </p>
                        <p className="text-slate-400 text-[11px] font-medium truncate">
                            Học viên chăm chỉ
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
