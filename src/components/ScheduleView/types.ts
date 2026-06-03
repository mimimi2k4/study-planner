import type { ScheduleSlot, ExamInfo, ScheduleWarning, StudyTask, FreeSlot } from "../../types";
import type { DispatchAction } from "../../hooks/usePlanManager";

export interface ScheduleViewProps {
    slots: ScheduleSlot[];
    exams: ExamInfo[];
    warnings: ScheduleWarning[];
    overflow?: StudyTask[];
    tasks: StudyTask[];
    freeSlots: FreeSlot[];
    onRegenerate: () => void;
    onSlotsChange: (slots: ScheduleSlot[]) => void;
    /** Hook dispatch — dùng để xóa / di chuyển slot qua executePlanAction */
    onDispatch?: (cmd: DispatchAction) => boolean;
}
