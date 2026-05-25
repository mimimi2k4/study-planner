export type ExamFormat = 'multiple_choice' | 'essay' | 'combined'
export type DifficultyLevel = 'low' | 'medium' | 'high'
export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type PlanAction = 'add_task' | 'delete_task' | 'move_task' | 'reset_auto' | 'update_task_status'

export interface ExamInfo {
  id: string
  subjectName: string
  examDateTime: string // ISO string
  examFormat: ExamFormat
  targetScore: number // 0–10
  color: string // hex color
}

export interface Chapter {
  id: string
  name: string
  difficulty: DifficultyLevel
  importance: DifficultyLevel
}

export interface Syllabus {
  id: string
  subjectId: string
  subjectName: string
  chapters: Chapter[]
}

export interface FreeSlot {
  day: number // 0=Mon … 6=Sun
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
}

export interface StudyTask {
  id: string
  name: string
  chapter: string
  subjectId: string
  subjectName: string
  estimatedMinutes: number
  priority: DifficultyLevel
  status: TaskStatus
  color: string
}

export interface ScheduleSlot {
  id: string
  date: string // "YYYY-MM-DD"
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
  taskName: string
  taskId: string
  subjectName: string
  subjectId: string
  color: string
  manualEdited?: boolean
}

export interface StudyPlan {
  slots: ScheduleSlot[]
  generatedAt: string
  manualEdited: boolean
}

export interface ExamCountdownResult {
  daysLeft: number
  hoursLeft: number
  totalTasks: number
  completedTasks: number
  tasksPerDay: number
  completionRate: number
  isOverdue: boolean
}

export interface TimetableSlot {
  date: string        // "YYYY-MM-DD"
  startTime: string   // "HH:mm"
  endTime: string     // "HH:mm"
  taskName: string
  subjectName: string
  color: string
}

export interface ScheduleWarning {
  type: 'insufficient_time' | 'no_slots' | 'past_exam'
  message: string
  suggestion?: string
}
