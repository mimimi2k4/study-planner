export const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
export const DAYS_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const ZONE: Record<
    string,
    { bg: string; selBg: string; labelColor: string; name: string; legendBorder: string }
> = {
    morning: {
        bg: "#f8fafc", // slate-50
        selBg: "#10b981", // emerald-500
        labelColor: "#64748b", // slate-500
        name: "Sáng",
        legendBorder: "#e2e8f0", // slate-200
    },
    afternoon: {
        bg: "#f8fafc",
        selBg: "#10b981",
        labelColor: "#64748b",
        name: "Chiều",
        legendBorder: "#e2e8f0",
    },
    evening: {
        bg: "#f8fafc",
        selBg: "#10b981",
        labelColor: "#64748b",
        name: "Tối",
        legendBorder: "#e2e8f0",
    },
};
