import { type ReactNode } from "react";
import Sidebar from "./Sidebar";

const SIDEBAR_W = 240;

export interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="flex min-h-screen" style={{ background: "#f3f0ff" }}>
            <Sidebar width={SIDEBAR_W} />
            <main className="flex-1 min-h-screen" style={{ marginLeft: SIDEBAR_W }}>
                <div
                    className="min-h-screen"
                    style={{ padding: "32px 48px 64px 48px", maxWidth: 1400 }}
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
