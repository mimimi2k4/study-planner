import type { ScheduleSlot, ExamInfo, ScheduleWarning } from '../../types'

export interface ScheduleViewProps {
  slots: ScheduleSlot[]
  exams: ExamInfo[]
  warnings: ScheduleWarning[]
  onRegenerate: () => void
  onSlotsChange: (slots: ScheduleSlot[]) => void
}
