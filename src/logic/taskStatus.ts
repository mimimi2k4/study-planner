import type { TaskStatus } from "../types";

export function getNextTaskStatus(current: TaskStatus): TaskStatus {
    if (current === "pending") return "in_progress";
    if (current === "in_progress") return "completed";
    return "pending";
}
