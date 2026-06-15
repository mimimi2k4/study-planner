import { ArrowRight, BookOpen, Clock, Calendar, Award, Target } from "lucide-react";
import { Link } from "react-router-dom";
import type { ExamInfo, Milestone, ScheduleSlot } from "../../types";

interface OverviewCardsProps {
    completionRate: number;
    nextExam?: ExamInfo;
    nextCountdown: { daysLeft: number; isOverdue: boolean } | null;
    nearestMilestone?: Milestone;
    todaySlots: ScheduleSlot[];
    hasExams: boolean;
    hasMilestones: boolean;
    hasPlan: boolean;
}

export default function OverviewCards({
    completionRate,
    nextExam,
    nextCountdown,
    nearestMilestone,
    todaySlots,
    hasExams,
    hasMilestones,
    hasPlan,
}: OverviewCardsProps) {
    // Contextual empty states
    if (!hasExams) {
        return null;
    }

    if (!hasPlan && !hasMilestones) {
        return null;
    }

    const formatRange = (slot: ScheduleSlot) => `${slot.startTime}–${slot.endTime}`;

    return (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Countdown card */}
            {nextExam && nextCountdown && !nextCountdown.isOverdue && (
                <div className="card rounded-2xl p-5 border border-orange-200 bg-orange-50 shadow-sm col-span-1 md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2.5 mb-3">
                        <Clock size={18} className="text-orange-600" />
                        <h3 className="font-bold text-orange-900 text-sm">
                            {nextExam.subjectName}
                        </h3>
                    </div>
                    <p className="text-3xl font-black text-orange-700 mt-1">
                        {nextCountdown.daysLeft} ngày
                    </p>
                    <p className="text-orange-600/80 text-xs font-semibold mt-1 uppercase tracking-wide">
                        Đếm ngược thi
                    </p>
                </div>
            )}

            {/* Completion rate card */}
            <div className="card rounded-2xl p-5 border border-emerald-200 bg-emerald-50 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                    <BookOpen size={18} className="text-emerald-600" />
                    <h3 className="font-bold text-emerald-900 text-sm">Tiến độ tổng</h3>
                </div>
                <p className="text-3xl font-black text-emerald-700 mt-1">{completionRate}%</p>
                <p className="text-emerald-600/80 text-xs font-semibold mt-1 uppercase tracking-wide">
                    Hoàn thành
                </p>
            </div>

            {/* Today schedule */}
            <div className="card rounded-2xl p-5 border border-slate-200 bg-white shadow-sm md:col-span-2">
                <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-3">
                    <Calendar size={18} className="text-slate-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Lịch học hôm nay</h3>
                </div>
                {todaySlots.length > 0 ? (
                    <ul className="space-y-3 mt-3">
                        {todaySlots.map((slot) => (
                            <li key={slot.id} className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-slate-700 truncate mr-4">
                                    {slot.subjectName}
                                </span>
                                <span className="font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shrink-0">
                                    {formatRange(slot)}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 text-sm mt-3 font-medium">
                        Không có lịch học hôm nay
                    </p>
                )}
            </div>

            {/* Milestone card */}
            {nearestMilestone && (
                <div className="card rounded-2xl p-5 border border-blue-200 bg-blue-50 shadow-sm md:col-span-2 lg:col-span-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <Award size={18} className="text-blue-600" />
                        <h3 className="font-bold text-blue-900 text-sm">Milestone gần nhất</h3>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <p className="font-bold text-blue-800 text-lg">{nearestMilestone.name}</p>
                        <p className="text-sm font-semibold text-blue-600/80 uppercase tracking-wide bg-blue-100 px-2.5 py-1 rounded-lg">
                            Hạn: {nearestMilestone.deadlineDate}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
