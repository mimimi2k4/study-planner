import { useCallback } from "react";
import type { StudyTask, StudyPlan } from "../types";
import { executePlanAction } from "../utils/storage";
import { savePlan, deletePlan, saveTasks } from "../utils/storage";
import { generateStudyTasks } from "../logic/studyTaskGenerator";
import { generateSchedule } from "../utils/scheduler";
import type { ExamInfo, Syllabus, FreeSlot } from "../types";

export interface PlanManagerDeps {
    plan: StudyPlan | null;
    setPlan: (p: StudyPlan | null) => void;
    tasks: StudyTask[];
    setTasks: (t: StudyTask[]) => void;
    // Cần để reset_auto có thể tạo lại lịch
    exams: ExamInfo[];
    syllabuses: Syllabus[];
    freeSlots: FreeSlot[];
    onWarning?: (msg: string) => void;
}

export type DispatchAction =
    | { action: "add_task"; payload: { taskId: string; date: string; startTime: string; endTime: string } }
    | { action: "delete_task"; payload: { slotId: string } }
    | { action: "move_task"; payload: { slotId: string; newDate: string; newStartTime: string; newEndTime: string } }
    | { action: "reset_auto"; payload?: Record<string, never> }
    | { action: "update_task_status"; payload: { taskId: string; status: StudyTask["status"] } };

export function usePlanManager({
    plan,
    setPlan,
    tasks,
    setTasks,
    exams,
    syllabuses,
    freeSlots,
    onWarning,
}: PlanManagerDeps) {
    const dispatch = useCallback(
        (cmd: DispatchAction): boolean => {
            const result = executePlanAction(
                cmd.action,
                (cmd.payload ?? {}) as Record<string, unknown>,
                plan,
                tasks,
                freeSlots
            );

            if (!result.success) {
                if (onWarning) onWarning(result.error);
                else console.error(result.error);
                return false;
            }

            // Cập nhật tasks nếu có thay đổi
            if (result.newTasks !== tasks) {
                setTasks(result.newTasks);
                saveTasks(result.newTasks);
            }

            // reset_auto: xoá plan cũ rồi tái tạo lịch mới
            if (cmd.action === "reset_auto") {
                deletePlan();
                setPlan(null);
                if (exams.length > 0 && syllabuses.length > 0 && freeSlots.length > 0) {
                    const newTasks = generateStudyTasks(syllabuses, exams);
                    setTasks(newTasks);
                    saveTasks(newTasks);
                    const { plan: newPlan } = generateSchedule(newTasks, freeSlots, exams);
                    setPlan(newPlan);
                    savePlan(newPlan);
                }
                return true;
            }

            // Các action khác: cập nhật plan
            if (result.newPlan) {
                setPlan(result.newPlan);
                savePlan(result.newPlan);
            } else {
                setPlan(null);
                deletePlan();
            }

            return true;
        },
        [plan, tasks, exams, syllabuses, freeSlots, setPlan, setTasks, onWarning]
    );

    return { dispatch };
}
