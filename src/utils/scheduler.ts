import type {
    StudyTask,
    FreeSlot,
    ExamInfo,
    ScheduleSlot,
    ScheduleWarning,
    StudyPlan,
} from "../types";
import { nanoid } from "./nanoid";
import { formatDate } from "./schedule";

function addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(":").map(Number);
    const total = h * 60 + m + minutes;
    const nh = Math.floor(total / 60) % 24;
    const nm = total % 60;
    return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

// Returns all dates in [start, end) that fall on a given weekday (0=Mon, 6=Sun)
function getDatesForDay(start: Date, end: Date, day: number): string[] {
    const dates: string[] = [];
    const cur = new Date(start);
    // JS getDay: 0=Sun..6=Sat → convert to 0=Mon..6=Sun
    const jsDay = day === 6 ? 0 : day + 1;
    while (cur < end) {
        if (cur.getDay() === jsDay) dates.push(formatDate(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return dates;
}

interface TimeBlock {
    date: string;
    startTime: string;
    endTime: string;
}

function expandFreeSlots(freeSlots: FreeSlot[], weeksAhead: number, startDate: Date): TimeBlock[] {
    const today = new Date(startDate);
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + weeksAhead * 7);

    const blocks: TimeBlock[] = [];
    for (const slot of freeSlots) {
        const dates = getDatesForDay(today, end, slot.day);
        for (const date of dates) {
            blocks.push({ date, startTime: slot.startTime, endTime: slot.endTime });
        }
    }
    return blocks.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
    });
}

export function generateSchedule(
    tasks: StudyTask[],
    freeSlots: FreeSlot[],
    exams: ExamInfo[],
    startDate: Date = new Date()
): { plan: StudyPlan; warnings: ScheduleWarning[]; overflow: StudyTask[] } {
    const warnings: ScheduleWarning[] = [];
    const overflow: StudyTask[] = [];

    if (freeSlots.length === 0) {
        return {
            plan: { slots: [], generatedAt: new Date().toISOString(), manualEdited: false },
            warnings: [
                {
                    type: "no_slots",
                    message: "Bạn chưa nhập thời gian rảnh. Vui lòng thêm khung giờ trước.",
                },
            ],
            overflow: tasks,
        };
    }

    // Keep pending and in_progress tasks, skip completed or 0-minute tasks
    const pendingTasks = tasks.filter((t) => t.status !== "completed" && t.estimatedMinutes > 0);
    if (pendingTasks.length === 0) {
        return {
            plan: { slots: [], generatedAt: new Date().toISOString(), manualEdited: false },
            warnings: [],
            overflow: [],
        };
    }

    const examDates: Record<string, string> = {};
    const examTimestamps: Record<string, number> = {};
    const nowMs = startDate.getTime();

    for (const exam of exams) {
        examDates[exam.id] = exam.examDateTime;
        examTimestamps[exam.id] = new Date(exam.examDateTime).getTime();
    }

    // EDF Sorting:
    // 1. Exam date ASC (Closer exams first)
    // 2. Priority DESC (high -> medium -> low)
    // 3. Estimated minutes DESC (Larger tasks first - bin packing heuristic)
    // 4. Name ASC (Deterministic tie-breaker)
    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const getExamTime = (task: StudyTask) => examTimestamps[task.subjectId] ?? Infinity;
    const getPriority = (task: StudyTask) => priorityWeight[task.priority] ?? 0;

    const sortedTasks = [...pendingTasks].sort((a, b) => {
        const timeA = getExamTime(a);
        const timeB = getExamTime(b);
        if (timeA !== timeB) return timeA - timeB;

        const prioA = getPriority(a);
        const prioB = getPriority(b);
        if (prioA !== prioB) return prioB - prioA;

        if (a.estimatedMinutes !== b.estimatedMinutes) {
            return b.estimatedMinutes - a.estimatedMinutes;
        }

        return a.name.localeCompare(b.name);
    });

    const maxExamDate = exams.reduce((latest, e) => {
        return new Date(e.examDateTime) > new Date(latest) ? e.examDateTime : latest;
    }, new Date().toISOString());
    const daysUntilLastExam = Math.max(
        4,
        Math.ceil((new Date(maxExamDate).getTime() - nowMs) / 86400000)
    );
    const weeksNeeded = Math.max(4, Math.ceil(daysUntilLastExam / 7) + 1);

    const blocks = expandFreeSlots(freeSlots, weeksNeeded, startDate);
    const slots: ScheduleSlot[] = [];

    const MIN_SESSION = 20;
    const BREAK = 5;

    const blockCapacity = blocks.map((b) => ({
        date: b.date,
        cursor: b.startTime,
        end: b.endTime,
    }));

    for (const task of sortedTasks) {
        const examDate = examDates[task.subjectId];
        let remaining = task.estimatedMinutes;

        for (const block of blockCapacity) {
            if (remaining <= 0) break;
            if (examDate && block.date >= examDate.slice(0, 10)) continue;

            const available = timeToMinutes(block.end) - timeToMinutes(block.cursor);
            if (available < MIN_SESSION) continue;

            const chunk = Math.min(remaining, available);
            if (chunk < MIN_SESSION && remaining > chunk) continue;

            const slotEnd = addMinutes(block.cursor, chunk);

            slots.push({
                id: nanoid(),
                date: block.date,
                startTime: block.cursor,
                endTime: slotEnd,
                taskName: task.name,
                taskId: task.id,
                subjectName: task.subjectName,
                subjectId: task.subjectId,
                color: task.color,
            });

            block.cursor = addMinutes(slotEnd, BREAK);
            remaining -= chunk;
        }

        if (remaining > 0) {
            overflow.push({
                ...task,
                estimatedMinutes: remaining,
            });
        }
    }

    if (overflow.length > 0) {
        const overflowSubjects = Array.from(new Set(overflow.map((t) => t.subjectName)));
        warnings.push({
            type: "insufficient_time",
            message: `Không đủ thời gian ôn tập cho môn: ${overflowSubjects.join(", ")}.`,
            suggestion: "Hãy bổ sung thêm thời gian rảnh hoặc giảm bớt khối lượng đề cương ôn tập.",
        });
    }

    slots.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
    });

    return {
        plan: { slots, generatedAt: new Date().toISOString(), manualEdited: false },
        warnings,
        overflow,
    };
}
