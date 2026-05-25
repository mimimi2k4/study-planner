import type { ExamInfo, Syllabus, FreeSlot, StudyTask, StudyPlan, ScheduleSlot } from "../types";

const KEYS = {
    EXAMS: "study_exams",
    SYLLABUSES: "study_syllabuses",
    FREE_SLOTS: "study_free_slots",
    TASKS: "study_tasks",
    PLAN: "study_plan",
} as const;

function load<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function save<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
}

// Exams
export const getExams = (): ExamInfo[] => load(KEYS.EXAMS, []);
export const saveExams = (exams: ExamInfo[]): void => save(KEYS.EXAMS, exams);
export const addExam = (exam: ExamInfo): void => saveExams([...getExams(), exam]);
export const updateExam = (exam: ExamInfo): void =>
    saveExams(getExams().map((e) => (e.id === exam.id ? exam : e)));
export const deleteExam = (id: string): void => saveExams(getExams().filter((e) => e.id !== id));

// Syllabuses
export const getSyllabuses = (): Syllabus[] => load(KEYS.SYLLABUSES, []);
export const saveSyllabuses = (list: Syllabus[]): void => save(KEYS.SYLLABUSES, list);
export const addSyllabus = (s: Syllabus): void => saveSyllabuses([...getSyllabuses(), s]);
export const updateSyllabus = (s: Syllabus): void =>
    saveSyllabuses(getSyllabuses().map((x) => (x.id === s.id ? s : x)));
export const deleteSyllabus = (id: string): void =>
    saveSyllabuses(getSyllabuses().filter((x) => x.id !== id));

// Free slots
export const getFreeSlots = (): FreeSlot[] => load(KEYS.FREE_SLOTS, []);
export const saveFreeSlots = (slots: FreeSlot[]): void => save(KEYS.FREE_SLOTS, slots);

// Tasks
export const getTasks = (): StudyTask[] => load(KEYS.TASKS, []);
export const saveTasks = (tasks: StudyTask[]): void => save(KEYS.TASKS, tasks);

// Study plan
export const getPlan = (): StudyPlan | null => load<StudyPlan | null>(KEYS.PLAN, null);
export const savePlan = (plan: StudyPlan): void => save(KEYS.PLAN, plan);
export const deletePlan = (): void => localStorage.removeItem(KEYS.PLAN);

// Plan actions (Task 11)
export function executePlanAction(
    action: "add_task" | "delete_task" | "move_task" | "reset_auto" | "update_task_status",
    payload?: Record<string, unknown>
): { success: boolean; error?: string } {
    const plan = getPlan();

    if (action === "reset_auto") {
        deletePlan();
        return { success: true };
    }

    if (!plan) return { success: false, error: "Chưa có kế hoạch học. Hãy tạo lịch trước." };

    if (action === "delete_task") {
        const { slotId } = payload as { slotId: string };
        if (!slotId) return { success: false, error: "Thiếu slotId" };
        plan.slots = plan.slots.filter((s) => s.id !== slotId);
        plan.manualEdited = true;
        savePlan(plan);
        return { success: true };
    }

    if (action === "move_task") {
        const { slotId, newDate, newStartTime, newEndTime } = payload as {
            slotId: string;
            newDate: string;
            newStartTime: string;
            newEndTime: string;
        };
        if (!slotId || !newDate) return { success: false, error: "Thiếu thông tin dịch chuyển" };
        plan.slots = plan.slots.map(
            (s): ScheduleSlot =>
                s.id === slotId
                    ? {
                          ...s,
                          date: newDate,
                          startTime: newStartTime,
                          endTime: newEndTime,
                          manualEdited: true,
                      }
                    : s
        );
        plan.manualEdited = true;
        savePlan(plan);
        return { success: true };
    }

    if (action === "update_task_status") {
        const { taskId, status } = payload as { taskId: string; status: string };
        const tasks = getTasks();
        saveTasks(
            tasks.map((t) =>
                t.id === taskId ? { ...t, status: status as StudyTask["status"] } : t
            )
        );
        return { success: true };
    }

    return { success: false, error: "Action không hợp lệ" };
}
