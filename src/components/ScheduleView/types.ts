import type { ScheduleSlot, ExamInfo, ScheduleWarning, StudyTask } from "../../types";
import type { DispatchAction } from "../../hooks/usePlanManager";

export interface ScheduleViewProps {
    slots: ScheduleSlot[];
    exams: ExamInfo[];
    warnings: ScheduleWarning[];
    overflow?: StudyTask[];
    tasks: StudyTask[];
    onRegenerate: () => void;
    onSlotsChange: (slots: ScheduleSlot[]) => void;
    /** Hook dispatch — dùng để xóa / di chuyển slot qua executePlanAction */
    onDispatch?: (cmd: DispatchAction) => boolean;
}
