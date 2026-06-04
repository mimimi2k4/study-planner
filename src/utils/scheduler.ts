import type {
    StudyTask,
    FreeSlot,
    ExamInfo,
    ScheduleSlot,
    ScheduleWarning,
    StudyPlan,
    Milestone,
} from "../types";
import { nanoid } from "./nanoid";
import { formatDate } from "./schedule";

function addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(":").map(Number);
    const total = h * 60 + m + Math.round(minutes);
    const nh = Math.floor(total / 60) % 24;
    const nm = Math.round(total % 60);
    return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

export function totalScheduledByName(slots: ScheduleSlot[], taskName: string): number {
    return slots
        .filter((s) => s.taskName === taskName)
        .reduce((sum, s) => sum + timeToMinutes(s.endTime) - timeToMinutes(s.startTime), 0);
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
    milestones: Milestone[] = [],
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

    // Milestone urgency: per-subject boost when milestone is approaching but behind
    const milestoneUrgencies = computeMilestoneUrgencies(milestones, exams, tasks, nowMs);

    // EDF Sorting with milestone awareness:
    // 0. Milestone urgency DESC (subjects behind on milestones get priority)
    // 1. Exam date ASC (Closer exams first)
    // 2. Priority DESC (high -> medium -> low)
    // 3. Estimated minutes DESC (Larger tasks first - bin packing heuristic)
    // 4. Name ASC (Deterministic tie-breaker)
    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const getExamTime = (task: StudyTask) => examTimestamps[task.subjectId] ?? Infinity;
    const getPriority = (task: StudyTask) => priorityWeight[task.priority] ?? 0;

    const sortedTasks = [...pendingTasks].sort((a, b) => {
        const urgA = milestoneUrgencies[a.subjectId] ?? 0;
        const urgB = milestoneUrgencies[b.subjectId] ?? 0;

        // Significant milestone gap overrides exam date ordering
        if (urgA > 0.1 || urgB > 0.1) {
            if (Math.abs(urgA - urgB) > 0.05) return urgB - urgA;
        }

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

    const todayStr = formatDate(startDate);
    const currentMins = startDate.getHours() * 60 + startDate.getMinutes();
    const PREPARATION_BUFFER = 15; // 15 minutes buffer for preparation
    const earliestStartMins = currentMins + PREPARATION_BUFFER;

    // ── Milestone budgets per subject ──
    const totalMsBySubject = calcTotalMinutesBySubject(tasks);
    const subjectBudgets = buildSubjectBudgets(milestones, exams, nowMs);
    const scheduledMsBySubject: Record<string, number> = {};

    function budgetRemainingForBlock(subjectId: string, blockDate: string): number {
        const budgets = subjectBudgets[subjectId];
        if (!budgets || budgets.length === 0) return Infinity;
        const total = totalMsBySubject[subjectId] ?? 0;
        if (total === 0) return Infinity;
        const budget = budgets.find((b) => blockDate <= b.deadlineDate);
        const pct = budget?.cumulativePct ?? 1;
        return Math.max(0, total * pct - (scheduledMsBySubject[subjectId] ?? 0));
    }

    const blockCapacity = blocks.map((b) => {
        let cursor = b.startTime;
        if (b.date === todayStr) {
            const startMins = timeToMinutes(b.startTime);
            if (earliestStartMins > startMins) {
                const h = Math.floor(earliestStartMins / 60) % 24;
                const m = earliestStartMins % 60;
                cursor = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            }
        }
        return {
            date: b.date,
            startTime: b.startTime,
            cursor: cursor,
            end: b.endTime,
        };
    });

    for (const task of sortedTasks) {
        const examDateStr = examDates[task.subjectId];
        let remaining = task.estimatedMinutes;

        for (const block of blockCapacity) {
            if (remaining <= 0) break;
            if (examDateStr && block.date >= examDateStr.slice(0, 10)) continue;

            // Milestone budget check: don't exceed period budget for this subject
            const budgetLeft = budgetRemainingForBlock(task.subjectId, block.date);
            if (budgetLeft <= 0) continue;

            const cursorMins = timeToMinutes(block.cursor);
            const startMins = timeToMinutes(block.startTime);
            const endMins = timeToMinutes(block.end);

            if (cursorMins < startMins || cursorMins >= endMins) continue;

            const available = endMins - cursorMins;
            if (available < MIN_SESSION) continue;

            let chunk = Math.min(remaining, available, budgetLeft);
            if (chunk < MIN_SESSION) {
                if (budgetLeft >= MIN_SESSION) chunk = MIN_SESSION;
                else continue;
            }

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
            scheduledMsBySubject[task.subjectId] = (scheduledMsBySubject[task.subjectId] ?? 0) + chunk;
        }

        if (remaining > 0) {
            overflow.push({
                ...task,
                estimatedMinutes: remaining,
            });
        }
    }

    const insufficientSubjects = new Set<string>();
    for (const task of pendingTasks) {
        const scheduled = totalScheduledByName(slots, task.name);
        if (scheduled < MIN_SESSION) {
            insufficientSubjects.add(task.subjectName);
        }
    }
    if (insufficientSubjects.size > 0) {
        warnings.push({
            type: "insufficient_time",
            message: `Không đủ thời gian ôn tập cho môn: ${Array.from(insufficientSubjects).join(", ")}.`,
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

interface MilestoneBudget {
    deadlineDate: string;
    cumulativePct: number;
}

function calcTotalMinutesBySubject(tasks: StudyTask[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const t of tasks) {
        result[t.subjectId] = (result[t.subjectId] ?? 0) + t.estimatedMinutes;
    }
    return result;
}

function buildSubjectBudgets(
    milestones: Milestone[],
    exams: ExamInfo[],
    nowMs: number
): Record<string, MilestoneBudget[]> {
    const result: Record<string, MilestoneBudget[]> = {};

    for (const exam of exams) {
        const subjectId = exam.id;
        const examMs = new Date(exam.examDateTime).getTime();

        const subjectMilestones = milestones
            .filter((m) => m.subjectId === subjectId)
            .sort(
                (a, b) =>
                    new Date(a.deadlineDate).getTime() -
                    new Date(b.deadlineDate).getTime()
            );

        if (subjectMilestones.length > 0) {
            const budgets: MilestoneBudget[] = subjectMilestones.map((m, i) => ({
                deadlineDate: m.deadlineDate,
                cumulativePct: (i + 1) / subjectMilestones.length,
            }));
            result[subjectId] = budgets;
        } else {
            // Fallback: split exam period into 4 equal quarters
            const totalDays = Math.max(
                4,
                Math.ceil((examMs - nowMs) / 86400000)
            );
            const quarterDays = Math.ceil(totalDays / 4);
            const budgets: MilestoneBudget[] = [];
            for (let i = 1; i <= 4; i++) {
                const d = new Date(nowMs + i * quarterDays * 86400000);
                if (d.getTime() >= examMs) break;
                budgets.push({
                    deadlineDate: d.toISOString().split("T")[0],
                    cumulativePct: i / 4,
                });
            }
            budgets.push({
                deadlineDate: new Date(examMs).toISOString().split("T")[0],
                cumulativePct: 1,
            });
            result[subjectId] = budgets;
        }
    }

    return result;
}

function computeMilestoneUrgencies(
    milestones: Milestone[],
    exams: ExamInfo[],
    allTasks: StudyTask[],
    nowMs: number
): Record<string, number> {
    if (milestones.length === 0) return {};

    const result: Record<string, number> = {};

    for (const exam of exams) {
        const subjectId = exam.id;
        const examMs = new Date(exam.examDateTime).getTime();

        const subjectMilestones = milestones
            .filter(
                (m) =>
                    m.subjectId === subjectId &&
                    new Date(m.deadlineDate).getTime() > nowMs
            )
            .sort(
                (a, b) =>
                    new Date(a.deadlineDate).getTime() -
                    new Date(b.deadlineDate).getTime()
            );

        if (subjectMilestones.length === 0) continue;

        const nextMs = new Date(subjectMilestones[0].deadlineDate).getTime();
        const totalDuration = examMs - nowMs;
        const elapsedAtMilestone = nextMs - nowMs;
        const expectedPct =
            totalDuration > 0 ? Math.min(1, elapsedAtMilestone / totalDuration) : 1;

        const subjectTasks = allTasks.filter((t) => t.subjectId === subjectId);
        const totalMinutes = subjectTasks.reduce(
            (s, t) => s + t.estimatedMinutes,
            0
        );
        const completedMinutes = subjectTasks
            .filter((t) => t.status === "completed")
            .reduce((s, t) => s + t.estimatedMinutes, 0);
        const actualPct = totalMinutes > 0 ? completedMinutes / totalMinutes : 0;

        const gap = Math.max(0, expectedPct - actualPct);
        if (gap > 0) result[subjectId] = gap;
    }

    return result;
}
