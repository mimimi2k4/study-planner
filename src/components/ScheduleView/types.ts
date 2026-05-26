import type { ScheduleSlot, ExamInfo, ScheduleWarning, StudyTask } from "../../types";

export interface ScheduleViewProps {
    slots: ScheduleSlot[];
    exams: ExamInfo[];
    warnings: ScheduleWarning[];
    overflow?: StudyTask[];
    onRegenerate: () => void;
    onSlotsChange: (slots: ScheduleSlot[]) => void;
}
