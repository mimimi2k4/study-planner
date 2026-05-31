import type {
    ExamInfo,
    Syllabus,
    FreeSlot,
    StudyTask,
    StudyPlan,
    ScheduleSlot,
    Milestone,
} from "../types";
import { z } from "zod";
import {
    ExamInfoArraySchema,
    SyllabusArraySchema,
    FreeSlotArraySchema,
    StudyTaskArraySchema,
    StudyPlanSchema,
    MilestoneArraySchema,
} from "../types/schemas";

const KEYS = {
    EXAMS: "study_exams",
    SYLLABUSES: "study_syllabuses",
    FREE_SLOTS: "study_free_slots",
    TASKS: "study_tasks",
    PLAN: "study_plan",
    MILESTONES: "study_milestones",
} as const;

function load<T>(key: string, fallback: T, schema?: z.ZodType<T>): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (schema) {
            const result = schema.safeParse(parsed);
            if (!result.success) {
                console.warn(`Lỗi validation schema cho key "${key}":`, result.error.message);
                return fallback;
            }
            return result.data;
        }
        return parsed as T;
    } catch {
        return fallback;
    }
}

function save<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
}

// Exams
export const getExams = (): ExamInfo[] => load(KEYS.EXAMS, [], ExamInfoArraySchema);
export const saveExams = (exams: ExamInfo[]): void => save(KEYS.EXAMS, exams);
export const addExam = (exam: ExamInfo): void => saveExams([...getExams(), exam]);
export const updateExam = (exam: ExamInfo): void =>
    saveExams(getExams().map((e) => (e.id === exam.id ? exam : e)));
export const deleteExam = (id: string): void => saveExams(getExams().filter((e) => e.id !== id));

const DIFFICULTY_MAP: Record<string, string> = {
    low: "low",
    medium: "medium",
    high: "high",
    easy: "low",
    normal: "medium",
    hard: "high",
    thấp: "low",
    "trung bình": "medium",
    cao: "high",
};

function normalizeDifficulty(val: unknown): "low" | "medium" | "high" {
    const s = String(val ?? "")
        .toLowerCase()
        .trim();
    return (DIFFICULTY_MAP[s] ?? "medium") as "low" | "medium" | "high";
}

// Syllabuses
export const getSyllabuses = (): Syllabus[] => {
    const list = load(KEYS.SYLLABUSES, [], SyllabusArraySchema);
    return list.map((s) => ({
        ...s,
        chapters: s.chapters.map((c) => ({
            ...c,
            difficulty: normalizeDifficulty(c.difficulty),
            importance: normalizeDifficulty(c.importance),
        })),
    }));
};
export const saveSyllabuses = (list: Syllabus[]): void => save(KEYS.SYLLABUSES, list);
export const addSyllabus = (s: Syllabus): void => saveSyllabuses([...getSyllabuses(), s]);
export const updateSyllabus = (s: Syllabus): void =>
    saveSyllabuses(getSyllabuses().map((x) => (x.id === s.id ? s : x)));
export const deleteSyllabus = (id: string): void =>
    saveSyllabuses(getSyllabuses().filter((x) => x.id !== id));

// Free slots
export const getFreeSlots = (): FreeSlot[] => load(KEYS.FREE_SLOTS, [], FreeSlotArraySchema);
export const saveFreeSlots = (slots: FreeSlot[]): void => save(KEYS.FREE_SLOTS, slots);

// Tasks
export const getTasks = (): StudyTask[] => load(KEYS.TASKS, [], StudyTaskArraySchema);
export const saveTasks = (tasks: StudyTask[]): void => save(KEYS.TASKS, tasks);

// Study plan
export const getPlan = (): StudyPlan | null => load(KEYS.PLAN, null, StudyPlanSchema.nullable());
export const savePlan = (plan: StudyPlan): void => save(KEYS.PLAN, plan);
export const deletePlan = (): void => localStorage.removeItem(KEYS.PLAN);

// Milestones
export const getMilestones = (): Milestone[] => load(KEYS.MILESTONES, [], MilestoneArraySchema);
export const saveMilestones = (milestones: Milestone[]): void => save(KEYS.MILESTONES, milestones);

// ─── Plan actions — pure function (không ghi localStorage trực tiếp) ──────────
// Nhận vào state hiện tại, trả về bản sao đã cập nhật.
// React Hook (usePlanManager) sẽ gọi setState() + localStorage từ bên ngoài.

export type PlanActionResult =
    | { success: true; newPlan: StudyPlan | null; newTasks: StudyTask[]; error?: undefined }
    | { success: false; error: string; newPlan?: undefined; newTasks?: undefined };

export function executePlanAction(
    action: "add_task" | "delete_task" | "move_task" | "reset_auto" | "update_task_status",
    payload: Record<string, unknown>,
    currentPlan: StudyPlan | null,
    currentTasks: StudyTask[],
    freeSlots: FreeSlot[] = []
): PlanActionResult {
    const parseTime = (t: string): number => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    };

    const isWithinFreeSlot = (date: string, startTime: string, endTime: string): boolean => {
        if (freeSlots.length === 0) return true; // Nếu chưa setup freeSlots thì thôi, nhưng thường là có
        const dayOfWeek = (new Date(date).getDay() + 6) % 7;
        const start = parseTime(startTime);
        const end = parseTime(endTime);

        return freeSlots.some(
            (slot) =>
                slot.day === dayOfWeek &&
                parseTime(slot.startTime) <= start &&
                parseTime(slot.endTime) >= end
        );
    };
    // reset_auto: xoá plan để hook gọi lại generateSchedule
    if (action === "reset_auto") {
        return { success: true, newPlan: null, newTasks: currentTasks };
    }

    if (action === "update_task_status") {
        const { taskId, status } = payload as { taskId: string; status: StudyTask["status"] };
        if (!taskId) return { success: false, error: "Thiếu taskId" };
        const newTasks = currentTasks.map((t) => (t.id === taskId ? { ...t, status } : t));
        return { success: true, newPlan: currentPlan, newTasks };
    }

    if (!currentPlan) {
        return { success: false, error: "Chưa có kế hoạch học. Hãy tạo lịch trước." };
    }

    if (action === "delete_task") {
        const { slotId } = payload as { slotId: string };
        if (!slotId) return { success: false, error: "Thiếu slotId" };
        const newPlan: StudyPlan = {
            ...currentPlan,
            slots: currentPlan.slots.filter((s) => s.id !== slotId),
            manualEdited: true,
        };
        return { success: true, newPlan, newTasks: currentTasks };
    }

    if (action === "move_task") {
        const { slotId, newDate, newStartTime, newEndTime } = payload as {
            slotId: string;
            newDate: string;
            newStartTime: string;
            newEndTime: string;
        };
        if (!slotId || !newDate || !newStartTime || !newEndTime)
            return {
                success: false,
                error: "Thiếu thông tin dịch chuyển (slotId, newDate, newStartTime, newEndTime)",
            };
        // Validate thời gian
        if (parseTime(newEndTime) <= parseTime(newStartTime))
            return { success: false, error: "Thời gian kết thúc phải sau thời gian bắt đầu" };
        if (!isWithinFreeSlot(newDate, newStartTime, newEndTime))
            return { success: false, error: "Ngoài khung giờ rảnh đã thiết lập" };
        const newPlan: StudyPlan = {
            ...currentPlan,
            manualEdited: true,
            slots: currentPlan.slots.map(
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
            ),
        };
        return { success: true, newPlan, newTasks: currentTasks };
    }

    if (action === "add_task") {
        const { taskId, date, startTime, endTime } = payload as {
            taskId: string;
            date: string;
            startTime: string;
            endTime: string;
        };
        if (!taskId || !date || !startTime || !endTime)
            return {
                success: false,
                error: "Thiếu thông tin thêm slot (taskId, date, startTime, endTime)",
            };
        if (parseTime(endTime) <= parseTime(startTime))
            return { success: false, error: "Thời gian kết thúc phải sau thời gian bắt đầu" };
        if (!isWithinFreeSlot(date, startTime, endTime))
            return { success: false, error: "Ngoài khung giờ rảnh đã thiết lập" };
        const task = currentTasks.find((t) => t.id === taskId);
        if (!task) return { success: false, error: `Không tìm thấy task với id "${taskId}"` };
        const newSlot: ScheduleSlot = {
            id: `manual-${Date.now().toString(36)}`,
            date,
            startTime,
            endTime,
            taskName: task.name,
            taskId: task.id,
            subjectName: task.subjectName,
            subjectId: task.subjectId,
            color: task.color,
            manualEdited: true,
        };
        const newPlan: StudyPlan = {
            ...currentPlan,
            manualEdited: true,
            slots: [...currentPlan.slots, newSlot].sort((a, b) =>
                a.date !== b.date
                    ? a.date.localeCompare(b.date)
                    : a.startTime.localeCompare(b.startTime)
            ),
        };
        return { success: true, newPlan, newTasks: currentTasks };
    }

    return { success: false, error: `Action không hợp lệ: "${action}"` };
}
