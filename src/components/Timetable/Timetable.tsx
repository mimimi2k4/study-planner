import type { TimetableSlot } from "../../types";
import { RefreshCw, Calendar } from "lucide-react";
import TimetableDay from "./TimetableDay";

interface Props {
    slots: TimetableSlot[];
    loading?: boolean;
    onRegenerate?: () => void;
}

export default function Timetable({ slots, loading, onRegenerate }: Props) {
    const grouped = new Map<string, TimetableSlot[]>();
    for (const slot of slots) {
        const list = grouped.get(slot.date) ?? [];
        list.push(slot);
        grouped.set(slot.date, list);
    }
    const sortedDays = Array.from(grouped.keys()).sort();

    if (slots.length === 0) {
        return (
            <div className="space-y-4">
                {onRegenerate && (
                    <div className="flex justify-end">
                        <button
                            onClick={onRegenerate}
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ borderRadius: 12 }}
                        >
                            <RefreshCw size={15} className={loading ? "animate-spin-s" : ""} />
                            {loading ? "Đang tạo..." : "Tạo lại lịch"}
                        </button>
                    </div>
                )}
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                    <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 text-base font-medium">
                        Chưa có lịch học, vui lòng nhập thông tin cần thiết
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <Calendar size={20} className="text-emerald-500" />
                    Thời khóa biểu
                </h2>
                {onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ borderRadius: 12 }}
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin-s" : ""} />
                        {loading ? "Đang tạo..." : "Tạo lại lịch"}
                    </button>
                )}
            </div>

            {sortedDays.map((date) => (
                <TimetableDay key={date} date={date} slots={grouped.get(date)!} />
            ))}
        </div>
    );
}
