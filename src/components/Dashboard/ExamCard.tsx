import type { ExamInfo, ExamCountdownResult } from "../../types";
import { Clock, Target, Flame, CheckCircle2 } from "lucide-react";

const FORMAT_LABELS: Record<string, string> = {
    multiple_choice: "Trắc nghiệm",
    essay: "Tự luận",
    combined: "Kết hợp",
};

export interface ExamCardProps {
    exam: ExamInfo;
    countdown: ExamCountdownResult | null;
}

export default function ExamCard({ exam, countdown }: ExamCardProps) {
    const urgent = countdown && !countdown.isOverdue && countdown.daysLeft <= 7;
    const overdue = countdown?.isOverdue;

    return (
        <div className="rounded-2xl overflow-hidden flex transition-all duration-150 border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm">
            <div className="w-1.5 shrink-0" style={{ background: exam.color }} />

            <div className="flex-1 px-5 py-4">
                {/* Name + format badge */}
                <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-slate-900 leading-snug" style={{ fontSize: 16 }}>
                        {exam.subjectName}
                    </p>
                    <span
                        className="shrink-0 inline-flex items-center px-2 py-1 rounded font-bold"
                        style={{ fontSize: 11, background: exam.color + "18", color: exam.color }}
                    >
                        {FORMAT_LABELS[exam.examFormat]}
                    </span>
                </div>

                {/* Info chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold bg-slate-100 text-slate-700">
                        <Clock size={14} />
                        {new Date(exam.examDateTime).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                    <span
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-bold"
                        style={{
                            background: exam.color + "10",
                            color: exam.color,
                        }}
                    >
                        <Target size={14} /> {exam.targetScore}/10
                    </span>
                </div>

                {/* Countdown block */}
                {countdown && (
                    <div
                        className="mt-4 rounded-xl px-4 py-3"
                        style={{
                            background: overdue
                                ? "#fff1f2"
                                : urgent
                                  ? "#fff7ed"
                                  : exam.color + "0a",
                            border: `1px solid ${
                                overdue ? "#ffe4e6" : urgent ? "#ffedd5" : exam.color + "20"
                            }`,
                        }}
                    >
                        {overdue ? (
                            <p className="text-sm font-semibold text-rose-600 flex items-center gap-2">
                                ⚠️ Đã qua ngày thi
                            </p>
                        ) : urgent ? (
                            <div className="flex items-center gap-2">
                                <Flame size={16} className="text-orange-500 shrink-0" />
                                <span className="font-bold text-orange-600 text-sm">
                                    Gấp! Còn {countdown.daysLeft} ngày{" "}
                                    {countdown.hoursLeft > 0 ? `${countdown.hoursLeft} giờ` : ""}
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-2">
                                    <span
                                        className="font-bold text-sm"
                                        style={{ color: exam.color }}
                                    >
                                        Còn {countdown.daysLeft} ngày
                                    </span>
                                    {countdown.totalTasks > 0 && (
                                        <span
                                            className="flex items-center gap-1.5 font-bold text-xs"
                                            style={{ color: exam.color }}
                                        >
                                            {countdown.completionRate === 100 && (
                                                <CheckCircle2 size={12} />
                                            )}
                                            {countdown.completionRate}% xong
                                        </span>
                                    )}
                                </div>
                                {countdown.totalTasks > 0 && (
                                    <div
                                        className="h-2 rounded-full overflow-hidden"
                                        style={{ background: exam.color + "20" }}
                                    >
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${countdown.completionRate}%`,
                                                background: exam.color,
                                            }}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
