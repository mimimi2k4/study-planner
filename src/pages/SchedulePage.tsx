import { useState, useEffect } from "react";
import type { ExamInfo, Syllabus, FreeSlot, StudyTask, StudyPlan, ScheduleSlot } from "../types";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import ScheduleView from "../components/ScheduleView/ScheduleView";
import { analyzeAndGenerateTasks } from "../utils/aiAnalyzer";
import { generateSchedule } from "../utils/scheduler";
import type { ScheduleWarning } from "../types";
import PageHeader from "../components/PageHeader";

export interface SchedulePageProps {
    exams: ExamInfo[];
    syllabuses: Syllabus[];
    freeSlots: FreeSlot[];
    tasks: StudyTask[];
    plan: StudyPlan | null;
    onTasksChange: (t: StudyTask[]) => void;
    onPlanChange: (p: StudyPlan | null) => void;
}

export default function SchedulePage({
    exams,
    syllabuses,
    freeSlots,
    tasks: _tasks,
    plan,
    onTasksChange,
    onPlanChange,
}: SchedulePageProps) {
    const [warnings, setWarnings] = useState<ScheduleWarning[]>([]);
    const [overflow, setOverflow] = useState<StudyTask[]>([]);
    const [generating, setGenerating] = useState(false);
    const canGenerate = exams.length > 0 && syllabuses.length > 0 && freeSlots.length > 0;

    // Recalculate warnings and overflow when the plan or criteria change (if not manually edited)
    useEffect(() => {
        if (plan && !plan.manualEdited && _tasks.length > 0 && freeSlots.length > 0 && exams.length > 0) {
            const { warnings: w, overflow: ov } = generateSchedule(_tasks, freeSlots, exams);
            setWarnings(w);
            setOverflow(ov);
        }
    }, [plan, _tasks, freeSlots, exams]);

    function doGenerate() {
        setGenerating(true);
        setTimeout(() => {
            const colorMap: Record<string, string> = {};
            exams.forEach((e) => {
                colorMap[e.id] = e.color;
            });
            const t = analyzeAndGenerateTasks(syllabuses, colorMap);
            onTasksChange(t);
            const { plan: p, warnings: w, overflow: ov } = generateSchedule(t, freeSlots, exams);
            onPlanChange(p);
            setWarnings(w);
            setOverflow(ov);
            setGenerating(false);
        }, 900);
    }

    const readyItems = [
        { label: "Môn thi", done: exams.length > 0, emoji: "📚" },
        { label: "Đề cương", done: syllabuses.length > 0, emoji: "📝" },
        { label: "Thời gian rảnh", done: freeSlots.length > 0, emoji: "⏰" },
    ];

    return (
        <div className="space-y-8">
            <PageHeader
                emoji="📅"
                title="Lịch học"
                subtitle="Xem và quản lý thời khóa biểu học tập của bạn"
                action={
                    canGenerate && !plan ? (
                        <button
                            onClick={doGenerate}
                            disabled={generating}
                            className="btn btn-primary"
                            style={{ borderRadius: 12 }}
                        >
                            <Sparkles size={15} className={generating ? "animate-spin-s" : ""} />
                            {generating ? "Đang tạo..." : "✨ Tạo lịch học"}
                        </button>
                    ) : undefined
                }
            />

            {!canGenerate && (
                <div
                    className="card p-5 flex items-start gap-4 rounded-2xl"
                    style={{ background: "#fffbeb", borderColor: "#fde68a" }}
                >
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
                        style={{ background: "#fef3c7" }}
                    >
                        💡
                    </div>
                    <div>
                        <p className="font-bold text-amber-800 mb-2.5">
                            Cần hoàn thành những bước này trước nhé!
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {readyItems.map((item) => (
                                <span
                                    key={item.label}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
                                    style={{
                                        background: item.done ? "#f0fdf4" : "#fff7ed",
                                        color: item.done ? "#15803d" : "#92400e",
                                        border: `1.5px solid ${item.done ? "#bbf7d0" : "#fed7aa"}`,
                                    }}
                                >
                                    {item.emoji}{" "}
                                    {item.done ? (
                                        <CheckCircle2 size={13} />
                                    ) : (
                                        <AlertCircle size={13} />
                                    )}
                                    {item.label}
                                    {!item.done && " — chưa có"}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <ScheduleView
                slots={plan?.slots ?? []}
                exams={exams}
                warnings={warnings}
                overflow={overflow}
                onRegenerate={doGenerate}
                onSlotsChange={(slots: ScheduleSlot[]) => {
                    if (!plan) return;
                    onPlanChange({ ...plan, slots, manualEdited: true });
                }}
            />
        </div>
    );
}
