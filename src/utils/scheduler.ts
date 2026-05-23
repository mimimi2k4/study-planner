import type { StudyTask, FreeSlot, ExamInfo, ScheduleSlot, ScheduleWarning, StudyPlan } from '../types'
import { nanoid } from './nanoid'

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// Returns all dates in [start, end) that fall on a given weekday (0=Mon, 6=Sun)
function getDatesForDay(start: Date, end: Date, day: number): string[] {
  const dates: string[] = []
  const cur = new Date(start)
  // JS getDay: 0=Sun..6=Sat → convert to 0=Mon..6=Sun
  const jsDay = day === 6 ? 0 : day + 1
  while (cur < end) {
    if (cur.getDay() === jsDay) dates.push(formatDate(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

interface TimeBlock {
  date: string
  startTime: string
  endTime: string
}

function expandFreeSlots(freeSlots: FreeSlot[], weeksAhead: number): TimeBlock[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setDate(end.getDate() + weeksAhead * 7)

  const blocks: TimeBlock[] = []
  for (const slot of freeSlots) {
    const dates = getDatesForDay(today, end, slot.day)
    for (const date of dates) {
      blocks.push({ date, startTime: slot.startTime, endTime: slot.endTime })
    }
  }
  return blocks.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.startTime.localeCompare(b.startTime)
  })
}

function urgencyScore(task: StudyTask, examDates: Record<string, string>): number {
  const examDate = examDates[task.subjectId]
  if (!examDate) return 0
  const daysLeft = Math.max(0, (new Date(examDate).getTime() - Date.now()) / 86400000)
  const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 }
  return (priorityWeight[task.priority] ?? 1) * 100 / (daysLeft + 1)
}

export function generateSchedule(
  tasks: StudyTask[],
  freeSlots: FreeSlot[],
  exams: ExamInfo[],
): { plan: StudyPlan; warnings: ScheduleWarning[] } {
  const warnings: ScheduleWarning[] = []

  if (freeSlots.length === 0) {
    return {
      plan: { slots: [], generatedAt: new Date().toISOString(), manualEdited: false },
      warnings: [{ type: 'no_slots', message: 'Bạn chưa nhập thời gian rảnh. Vui lòng thêm khung giờ trước.' }],
    }
  }

  const pendingTasks = tasks.filter((t) => t.status === 'pending')
  if (pendingTasks.length === 0) {
    return {
      plan: { slots: [], generatedAt: new Date().toISOString(), manualEdited: false },
      warnings: [{ type: 'no_slots', message: 'Không có task nào cần lên lịch.' }],
    }
  }

  const examDates: Record<string, string> = {}
  for (const exam of exams) examDates[exam.id] = exam.examDateTime

  const sortedTasks = [...pendingTasks].sort(
    (a, b) => urgencyScore(b, examDates) - urgencyScore(a, examDates),
  )

  const totalMinutesNeeded = sortedTasks.reduce((s, t) => s + t.estimatedMinutes, 0)

  const maxExamDate = exams.reduce((latest, e) => {
    return new Date(e.examDateTime) > new Date(latest) ? e.examDateTime : latest
  }, new Date().toISOString())
  const daysUntilLastExam = Math.max(4, Math.ceil((new Date(maxExamDate).getTime() - Date.now()) / 86400000))
  const weeksNeeded = Math.max(4, Math.ceil(daysUntilLastExam / 7) + 1)

  const blocks = expandFreeSlots(freeSlots, weeksNeeded)
  const totalMinutesAvailable = blocks.reduce((s, b) => {
    return s + timeToMinutes(b.endTime) - timeToMinutes(b.startTime)
  }, 0)

  if (totalMinutesAvailable < totalMinutesNeeded) {
    const deficit = totalMinutesNeeded - totalMinutesAvailable
    warnings.push({
      type: 'insufficient_time',
      message: `Thời gian rảnh không đủ (thiếu ${Math.ceil(deficit / 60)} giờ).`,
      suggestion: `Hãy thêm khoảng ${Math.ceil(deficit / 60 / weeksNeeded)} giờ/tuần để đủ thời gian ôn tập.`,
    })
  }

  const slots: ScheduleSlot[] = []

  // Track remaining capacity per block
  const blockCapacity: Array<{ date: string; cursor: string; end: string }> = blocks.map((b) => ({
    date: b.date,
    cursor: b.startTime,
    end: b.endTime,
  }))

  for (const task of sortedTasks) {
    // Filter blocks before the exam date for this task's subject
    const examDate = examDates[task.subjectId]
    let remaining = task.estimatedMinutes

    for (const block of blockCapacity) {
      if (remaining <= 0) break
      if (examDate && block.date >= examDate.slice(0, 10)) continue

      const availableMinutes = timeToMinutes(block.end) - timeToMinutes(block.cursor)
      if (availableMinutes <= 0) continue

      const chunk = Math.min(remaining, availableMinutes)
      const slotEnd = addMinutes(block.cursor, chunk)

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
      })

      block.cursor = slotEnd
      remaining -= chunk
    }
  }

  slots.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.startTime.localeCompare(b.startTime)
  })

  return {
    plan: { slots, generatedAt: new Date().toISOString(), manualEdited: false },
    warnings,
  }
}
