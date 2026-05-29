import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    subtitle: ReactNode;
    action?: ReactNode;
}

export default function PageHeader({ icon: Icon, title, subtitle, action }: PageHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0 border border-emerald-100">
                    <Icon size={24} strokeWidth={2} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 leading-tight">{title}</h1>
                    <div className="text-slate-500 text-sm mt-0.5 font-medium">{subtitle}</div>
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
