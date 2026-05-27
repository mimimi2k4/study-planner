import { useState, useEffect } from "react";
import type { ExamInfo, Syllabus, FreeSlot, StudyTask, StudyPlan, ScheduleSlot } from "../types";
import { generateStudyTasks } from "../logic/studyTaskGenerator";
import { generateSchedule } from "../utils/scheduler";
import { savePlan } from "../utils/storage";
import type { ScheduleWarning } from "../types";
import PageHeader from "../components/PageHeader";
import ScheduleView from "../components/ScheduleView/ScheduleView";

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
    const canGenerate = exams.length > 0 && syllabuses.length > 0 && freeSlots.length > 0;

    // Recalculate warnings when the plan or criteria change (if not manually edited)
    useEffect(() => {
        if (
            plan &&
            !plan.manualEdited &&
            _tasks.length > 0 &&
            freeSlots.length > 0 &&
            exams.length > 0
        ) {
            const { warnings: w } = generateSchedule(_tasks, freeSlots, exams);
            setWarnings(w);
        }
    }, [plan, _tasks, freeSlots, exams]);

    function doGenerate() {
        const tasks = generateStudyTasks(syllabuses, exams);
        onTasksChange(tasks);
        const { plan: p, warnings: w } = generateSchedule(tasks, freeSlots, exams);
        onPlanChange(p);
        setWarnings(w);
    }

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
                            className="btn btn-primary"
                            style={{ borderRadius: 12 }}
                        >
                            ✨ Tạo lịch học
                        </button>
                    ) : undefined
                }
            />

            <ScheduleView
                slots={plan?.slots ?? []}
                exams={exams}
                warnings={warnings}
                onRegenerate={doGenerate}
                onSlotsChange={(slots: ScheduleSlot[]) => {
                    if (!plan) return;
                    const u = { ...plan, slots, manualEdited: true };
                    savePlan(u);
                    onPlanChange(u);
                }}
            />
        </div>
    );
}
