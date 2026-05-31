import {
    BookOpen,
    ArrowRight,
    Zap,
    TrendingUp,
    Award,
    Star,
    FileText,
    Clock,
    Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ExamInfo, StudyTask, StudyPlan, Syllabus } from "../types";
import ExamCard from "../components/Dashboard/ExamCard";
import OverviewCards from "../components/Dashboard/OverviewCards";
import ProgressStepper from "../components/Dashboard/ProgressStepper";
import { useAllExamsCountdown } from "../hooks/useExamCountdown";
import CountdownProgress from "../components/CountdownProgress/CountdownProgress";
import MilestoneTimeline from "../components/MilestoneTimeline/MilestoneTimeline";
import type { Milestone } from "../types";

export interface DashboardPageProps {
    exams: ExamInfo[];
    syllabuses: Syllabus[];
    tasks: StudyTask[];
    plan: StudyPlan | null;
    freeHoursPerWeek: number;
    milestones: Milestone[];
}

const STEPS = [
    {
        label: "Thêm môn thi",
        desc: "Ngày thi & điểm mục tiêu",
        to: "/exams",
        icon: BookOpen,
        key: "exams",
    },
    {
        label: "Nhập đề cương",
        desc: "Chương học & độ khó",
        to: "/syllabus",
        icon: FileText,
        key: "syllabus",
    },
    {
        label: "Chọn giờ học",
        desc: "Khung giờ rảnh mỗi tuần",
        to: "/timeslots",
        icon: Clock,
        key: "timeslots",
    },
    {
        label: "Tạo lịch học",
        desc: "AI tự động phân bổ",
        to: "/schedule",
        icon: Calendar,
        key: "schedule",
    },
];

const GREETINGS = [
    "Hôm nay mình học gì nào?",
    "Cố lên, sắp đến ngày thi rồi!",
    "Mỗi bước nhỏ hôm nay tạo kết quả lớn mai sau.",
    "Học chăm hôm nay, thi tốt ngày mai.",
];

export default function DashboardPage({
    exams,
    syllabuses,
    tasks,
    plan,
    freeHoursPerWeek,
    milestones,
}: DashboardPageProps) {
    const countdowns = useAllExamsCountdown(exams, tasks);
    const sortedExams = [...exams].sort(
        (a, b) => new Date(a.examDateTime).getTime() - new Date(b.examDateTime).getTime()
    );
    const nextExam = sortedExams.find((e) => new Date(e.examDateTime) > new Date());
    const nextCountdown = nextExam ? countdowns[nextExam.id] : null;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const totalScheduled = plan?.slots.length ?? 0;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const greeting = GREETINGS[new Date().getDay() % GREETINGS.length];

    // Progress for next exam
    const examProgress = nextExam
        ? {
              totalTasks: tasks.filter((t) => t.subjectId === nextExam.id).length,
              completedTasks: tasks.filter(
                  (t) => t.subjectId === nextExam.id && t.status === "completed"
              ).length,
          }
        : undefined;

    const stepDone: Record<string, boolean> = {
        exams: exams.length > 0,
        syllabus: syllabuses.length > 0,
        timeslots: freeHoursPerWeek > 0,
        schedule: totalScheduled > 0,
    };

    const doneCount = Object.values(stepDone).filter(Boolean).length;
    const circumference = 2 * Math.PI * 20;

    // Prepare data for OverviewCards
    const todayStr = new Date().toISOString().split("T")[0];
    const todaySlots = plan?.slots.filter((s) => s.date === todayStr) ?? [];
    const upcomingMilestones = milestones
        .filter((m) => new Date(m.deadlineDate) >= new Date())
        .sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime());
    const nearestMilestone = upcomingMilestones[0];
    const hasData = exams.length > 0 && milestones.length > 0 && (plan?.slots.length ?? 0) > 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* ── Hero ── */}
            <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm px-10 py-8 flex items-center justify-between flex-wrap gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap size={14} className="text-emerald-500" />
                        <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest">
                            Dashboard
                        </span>
                    </div>
                    <h1 className="text-slate-900 font-black text-4xl leading-tight">Xin chào!</h1>
                    <p className="text-slate-500 font-medium text-base mt-2">{greeting}</p>

                    <div className="mt-6">
                        <CountdownProgress exam={nextExam} progress={examProgress} />
                    </div>
                </div>

                {/* Progress ring */}
                <div className="flex items-center gap-6 shrink-0 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="text-center">
                        <div className="relative w-[84px] h-[84px]">
                            <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    fill="none"
                                    stroke="#e2e8f0"
                                    strokeWidth="4"
                                />
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="4"
                                    strokeDasharray={`${circumference} ${circumference}`}
                                    strokeDashoffset={circumference * (1 - doneCount / 4)}
                                    strokeLinecap="round"
                                    style={{ transition: "stroke-dashoffset 1s ease" }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-slate-900 font-black text-xl leading-none">
                                    {Math.round((doneCount / 4) * 100)}%
                                </span>
                            </div>
                        </div>
                        <p className="text-slate-600 font-semibold text-xs uppercase tracking-wide mt-3">
                            Thiết lập: {doneCount}/4
                        </p>
                    </div>

                    {completionRate > 0 && (
                        <div className="text-center px-6 py-4 rounded-xl bg-white border border-emerald-100 shadow-sm">
                            <p className="text-4xl font-black text-emerald-600 leading-none">
                                {completionRate}
                                <span className="text-xl text-emerald-400 ml-1">%</span>
                            </p>
                            <p className="text-emerald-700/80 text-xs font-bold uppercase tracking-wide mt-2">
                                Nhiệm vụ xong
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Overview Cards ── */}
            <OverviewCards
                completionRate={completionRate}
                nextExam={nextExam}
                nextCountdown={nextCountdown}
                nearestMilestone={nearestMilestone}
                todaySlots={todaySlots}
                hasData={hasData}
                steps={STEPS}
            />

            {/* ── Body ── */}
            <div
                className="body-grid-responsive"
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(300px, 360px) 1fr",
                    gap: 24,
                    alignItems: "start",
                }}
            >
                {/* ── Cột trái: Setup checklist panel ── */}
                <div className="card rounded-2xl overflow-hidden bg-white border border-slate-200">
                    <div className="px-6 py-5 flex items-center gap-4 bg-slate-50 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 shadow-sm shrink-0">
                            <TrendingUp size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 text-lg leading-tight">
                                Các bước thiết lập
                            </h2>
                            <p className="text-slate-500 font-medium text-sm mt-0.5">
                                Hoàn thành để AI tạo lịch học
                            </p>
                        </div>
                    </div>

                    <div className="p-6 flex flex-col gap-3">
                        <ProgressStepper steps={STEPS} stepDone={stepDone} />
                    </div>
                </div>

                {/* ── Cột phải: Bao gồm Các môn thi sắp tới & Milestone Timeline ── */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                        gap: 24,
                        alignItems: "start",
                    }}
                >
                    {/* Upcoming exams panel */}
                    <div className="card rounded-2xl overflow-hidden bg-white border border-slate-200">
                        <div className="px-6 py-5 flex items-center justify-between gap-4 bg-slate-50 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 shadow-sm shrink-0">
                                    <Award size={20} className="text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900 text-lg leading-tight">
                                        Môn thi sắp tới
                                    </h2>
                                    <p className="text-slate-500 font-medium text-sm mt-0.5">
                                        Theo dõi thời gian còn lại
                                    </p>
                                </div>
                            </div>
                            {sortedExams.length > 0 && (
                                <Link
                                    to="/exams"
                                    className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:text-emerald-700 transition-colors shrink-0 text-sm no-underline"
                                >
                                    Xem tất cả <ArrowRight size={16} />
                                </Link>
                            )}
                        </div>

                        <div className="p-6 bg-white">
                            {sortedExams.length > 0 ? (
                                <div className="flex flex-col gap-4">
                                    {sortedExams.slice(0, 4).map((exam) => (
                                        <ExamCard
                                            key={exam.id}
                                            exam={exam}
                                            countdown={countdowns[exam.id] ?? null}
                                        />
                                    ))}

                                    {exams.length > 0 && (
                                        <div className="rounded-xl px-5 py-4 flex items-start gap-3 mt-2 bg-amber-50 border border-amber-100">
                                            <Star
                                                size={18}
                                                className="text-amber-500 shrink-0 mt-0.5"
                                            />
                                            <p className="text-amber-900 text-sm font-medium leading-relaxed">
                                                <span className="font-bold">Mẹo:</span> Ôn bài theo
                                                chu kỳ lặp lại (spaced repetition) giúp ghi nhớ tốt
                                                hơn 70%.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-14 text-center flex flex-col items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-base mb-1">
                                            Chưa có môn thi nào
                                        </h3>
                                        <p className="text-slate-500 font-medium text-sm">
                                            Thêm môn thi đầu tiên để bắt đầu lên kế hoạch.
                                        </p>
                                    </div>
                                    <Link
                                        to="/exams"
                                        className="btn btn-primary mt-2 no-underline rounded-xl px-5 py-2.5"
                                    >
                                        <BookOpen size={16} /> Thêm môn thi
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Milestone Timeline Component */}
                    <div>
                        <MilestoneTimeline milestones={milestones} />
                    </div>
                </div>
            </div>
        </div>
    );
}
