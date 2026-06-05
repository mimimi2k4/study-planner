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
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 md:p-10 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 border border-emerald-100 text-emerald-500">
                    <BookOpen size={32} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900 text-xl">Chào mừng đến với Study Planner!</h2>
                    <p className="text-slate-500 font-medium text-base mt-1.5 max-w-md mx-auto">
                        Bắt đầu bằng cách thêm môn thi — hệ thống sẽ tự động xây dựng lộ trình ôn tập cho bạn.
                    </p>
                </div>
                <Link
                    to="/exams"
                    className="inline-flex items-center gap-2 mt-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-sm"
                >
                    <BookOpen size={18} /> Thêm môn thi đầu tiên
                </Link>
            </div>
        );
    }

    if (!hasPlan && !hasMilestones) {
        return (
            <div className="grid gap-4 md:grid-cols-2">
                <Link
                    to="/exams"
                    className="card rounded-2xl p-6 flex items-center gap-4 hover:shadow-md transition-all border border-slate-200"
                >
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Target size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-base">Tạo cột mốc ôn tập</p>
                        <p className="text-slate-500 text-sm mt-0.5">Vào trang Môn thi để tạo milestone cho từng môn</p>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 shrink-0" />
                </Link>
                <Link
                    to="/schedule"
                    className="card rounded-2xl p-6 flex items-center gap-4 hover:shadow-md transition-all border border-slate-200"
                >
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <Calendar size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-base">Tạo lịch học</p>
                        <p className="text-slate-500 text-sm mt-0.5">Sau khi nhập đề cương và giờ rảnh, AI sẽ tự động sắp xếp</p>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 shrink-0" />
                </Link>
            </div>
        );
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
