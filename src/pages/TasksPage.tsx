import type { StudyTask, ExamInfo } from "../types";
import { getNextTaskStatus } from "../logic/taskStatus";
import {
    CheckSquare,
    Circle,
    Clock,
    Sparkles,
    PlayCircle,
    Trophy,
    BookOpen,
    Target,
} from "lucide-react";
import PageHeader from "../components/PageHeader";

const P_LABEL: Record<string, string> = { high: "Cao", medium: "TB", low: "Thấp" };
const P_STYLE: Record<string, { bg: string; text: string; border: string }> = {
    high: { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
    medium: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
    low: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
};

export interface TasksPageProps {
    tasks: StudyTask[];
    exams: ExamInfo[];
    onTasksChange: (t: StudyTask[]) => void;
}

export default function TasksPage({ tasks, exams, onTasksChange }: TasksPageProps) {
    function toggle(taskId: string) {
        const updated = tasks.map((t) =>
            t.id === taskId
                ? {
                      ...t,
                      status: getNextTaskStatus(t.status),
                  }
                : t
        );
        onTasksChange(updated);
    }

    const grouped = exams.reduce<Record<string, { exam: ExamInfo; tasks: StudyTask[] }>>(
        (acc, exam) => {
            acc[exam.id] = { exam, tasks: tasks.filter((t) => t.subjectId === exam.id) };
            return acc;
        },
        {}
    );

    const done = tasks.filter((t) => t.status === "completed").length;
    const rate = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col gap-8 h-full">
                <PageHeader
                    icon={CheckSquare}
                    title="Nhiệm vụ học tập"
                    subtitle="Theo dõi tiến độ hoàn thành từng nhiệm vụ"
                />
                <div className="card rounded-2xl p-16 text-center flex flex-col items-center justify-center flex-1 gap-5 bg-white border border-slate-200 shadow-sm border-dashed min-h-[400px]">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400">
                        <Target size={40} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-xl">Chưa có nhiệm vụ nào</p>
                        <p className="text-slate-500 text-base mt-2 max-w-md mx-auto leading-relaxed">
                            Vào <span className="text-emerald-600 font-bold">Lịch học</span> để AI
                            phân chia đề cương và tạo nhiệm vụ cho bạn nhé!
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 mt-4 shadow-sm">
                        <Sparkles size={18} /> Tạo lịch → nhiệm vụ tự sinh
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                icon={CheckSquare}
                title="Nhiệm vụ học tập"
                subtitle="Theo dõi tiến độ hoàn thành từng nhiệm vụ"
            />

            {/* Progress banner */}
            <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm px-8 py-8 flex items-center gap-10 flex-wrap">
                <div className="shrink-0">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
                        Tổng tiến độ
                    </p>
                    <div className="flex items-baseline gap-1.5">
                        <span
                            className="font-black leading-none text-emerald-600"
                            style={{ fontSize: 56 }}
                        >
                            {rate}
                        </span>
                        <span className="text-3xl font-bold text-slate-300">%</span>
                    </div>
                    <p className="text-slate-500 font-bold text-sm mt-2">
                        {done}/{tasks.length} nhiệm vụ hoàn thành
                    </p>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <div className="h-4 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
                        <div
                            className="h-full rounded-full transition-all duration-1000 bg-emerald-500"
                            style={{ width: `${rate}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-3 text-xs font-bold text-slate-400">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                    </div>
                </div>

                {rate === 100 && (
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-amber-50 border border-amber-100 text-amber-500 shrink-0 shadow-sm">
                        <Trophy size={40} />
                    </div>
                )}
            </div>

            {/* Task groups */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {Object.values(grouped).map(({ exam, tasks: sub }) => {
                    if (sub.length === 0) return null;
                    const subDone = sub.filter((t) => t.status === "completed").length;
                    const subRate = Math.round((subDone / sub.length) * 100);
                    return (
                        <div
                            key={exam.id}
                            className="card rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm"
                        >
                            {/* Color header */}
                            <div className="px-6 py-5 flex items-center gap-4 bg-slate-50 border-b border-slate-100">
                                <div
                                    className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                                    style={{ background: exam.color }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 text-lg truncate">
                                        {exam.subjectName}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-200">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${subRate}%`,
                                                    background: exam.color,
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold shrink-0 text-slate-500">
                                            {subDone}/{sub.length}
                                        </span>
                                    </div>
                                </div>
                                {subRate === 100 && (
                                    <span className="text-amber-500 shrink-0">
                                        <Trophy size={24} />
                                    </span>
                                )}
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-slate-100">
                                {sub.map((task) => {
                                    const ps = P_STYLE[task.priority];
                                    const isCompleted = task.status === "completed";
                                    const isInProgress = task.status === "in_progress";

                                    return (
                                        <div
                                            key={task.id}
                                            onClick={() => toggle(task.id)}
                                            className={`flex items-center gap-5 px-6 py-4 cursor-pointer select-none transition-colors ${
                                                isCompleted
                                                    ? "bg-slate-50/50"
                                                    : isInProgress
                                                      ? "bg-amber-50/30 hover:bg-amber-50"
                                                      : "hover:bg-slate-50"
                                            }`}
                                        >
                                            <div
                                                className="shrink-0 transition-all hover:scale-110"
                                                style={{
                                                    color: isCompleted
                                                        ? "#10b981"
                                                        : isInProgress
                                                          ? "#f59e0b"
                                                          : "#cbd5e1",
                                                }}
                                            >
                                                {isCompleted ? (
                                                    <CheckSquare size={24} strokeWidth={2.5} />
                                                ) : isInProgress ? (
                                                    <PlayCircle size={24} strokeWidth={2.5} />
                                                ) : (
                                                    <Circle size={24} strokeWidth={2.5} />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className={`font-semibold text-base truncate ${isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}
                                                >
                                                    {task.name}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500 truncate font-medium">
                                                    <BookOpen
                                                        size={14}
                                                        className="shrink-0 text-slate-400"
                                                    />
                                                    <span className="truncate">{task.chapter}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                                    <Clock size={14} />
                                                    {task.estimatedMinutes} phút
                                                </span>
                                                <span
                                                    className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide shadow-sm"
                                                    style={{
                                                        background: ps.bg,
                                                        color: ps.text,
                                                        border: `1px solid ${ps.border}`,
                                                    }}
                                                >
                                                    {P_LABEL[task.priority]}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
