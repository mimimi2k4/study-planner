import { useState, useEffect } from "react";
import type { ExamInfo, Syllabus, FreeSlot, StudyTask, StudyPlan, ScheduleSlot } from "../types";

import { generateSchedule } from "../utils/scheduler";
import type { ScheduleWarning } from "../types";
import PageHeader from "../components/PageHeader";
import ScheduleView from "../components/ScheduleView/ScheduleView";
import { usePlanManager } from "../hooks/usePlanManager";

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
    tasks,
    plan,
    onTasksChange,
    onPlanChange,
}: SchedulePageProps) {
    const [warnings, setWarnings] = useState<ScheduleWarning[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const canGenerate = exams.length > 0 && syllabuses.length > 0 && freeSlots.length > 0;

    const { dispatch } = usePlanManager({
        plan,
        setPlan: onPlanChange,
        tasks,
        setTasks: onTasksChange,
        exams,
        syllabuses,
        freeSlots,
        onWarning: setErrorMsg,
    });

    // Recalculate warnings when plan changes (nếu chưa edit tay)
    useEffect(() => {
        if (plan && !plan.manualEdited && tasks.length > 0 && freeSlots.length > 0 && exams.length > 0) {
            const { warnings: w } = generateSchedule(tasks, freeSlots, exams);
            setWarnings(w);
        }
    }, [plan, tasks, freeSlots, exams]);

    // Tự xoá thông báo lỗi sau 4 giây
    useEffect(() => {
        if (!errorMsg) return;
        const t = setTimeout(() => setErrorMsg(null), 4000);
        return () => clearTimeout(t);
    }, [errorMsg]);

    function doRegenerate() {
        dispatch({ action: "reset_auto" });
    }

    function handleSlotsChange(slots: ScheduleSlot[]) {
        // Dùng dispatch delete/move nếu slot bị xoá / thay đổi từ ScheduleView
        // Trường hợp ScheduleView gọi onSlotsChange trực tiếp → wrap lại thành plan update
        if (!plan) return;
        onPlanChange({ ...plan, slots, manualEdited: true });
    }

    return (
        <div className="space-y-8">
            {/* Toast lỗi */}
            {errorMsg && (
                <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-700"
                    style={{ background: "#fff1f2", border: "1.5px solid #fecdd3" }}
                >
                    <span>⚠️</span>
                    <span>{errorMsg}</span>
                    <button
                        className="ml-auto text-red-400 hover:text-red-600"
                        onClick={() => setErrorMsg(null)}
                    >
                        ✕
                    </button>
                </div>
            )}

            <PageHeader
                emoji="📅"
                title="Lịch học"
                subtitle={
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                        <span className="text-slate-500">Xem và quản lý thời khóa biểu học tập của bạn</span>
                        {plan?.manualEdited && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200" title="Lịch này sẽ không bị ghi đè tự động trừ khi bạn Tạo lại lịch">
                                ✍️ Đã chỉnh sửa thủ công
                            </span>
                        )}
                    </div>
                }
                action={
                    <div className="flex gap-2">
                        {canGenerate && !plan && (
                            <button onClick={doRegenerate} className="btn btn-primary" style={{ borderRadius: 12 }}>
                                ✨ Tạo lịch học
                            </button>
                        )}
                    </div>
                }
            />

            <ScheduleView
                slots={plan?.slots ?? []}
                exams={exams}
                tasks={tasks}
                warnings={warnings}
                onRegenerate={doRegenerate}
                onSlotsChange={handleSlotsChange}
                onDispatch={dispatch}
            />
        </div>
    );
}
