import { useState, useEffect } from 'react'
import type { ExamInfo, StudyTask, ExamCountdownResult } from '../types'

export function useExamCountdown(
  exam: ExamInfo | null,
  tasks: StudyTask[],
): ExamCountdownResult | null {
  const [result, setResult] = useState<ExamCountdownResult | null>(null)

  useEffect(() => {
    if (!exam) {
      setResult(null)
      return
    }

    function compute() {
      if (!exam) return
      const now = Date.now()
      const examTime = new Date(exam.examDateTime).getTime()
      const diffMs = examTime - now
      const daysLeft = Math.max(0, Math.floor(diffMs / 86400000))
      const hoursLeft = Math.max(0, Math.floor((diffMs % 86400000) / 3600000))
      const isOverdue = diffMs < 0

      const subjectTasks = tasks.filter((t) => t.subjectId === exam.id)
      const totalTasks = subjectTasks.length
      const completedTasks = subjectTasks.filter((t) => t.status === 'completed').length
      const pendingTasks = totalTasks - completedTasks
      const tasksPerDay = daysLeft > 0 ? Math.ceil(pendingTasks / daysLeft) : pendingTasks
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      setResult({ daysLeft, hoursLeft, totalTasks, completedTasks, tasksPerDay, completionRate, isOverdue })
    }

    compute()
    const interval = setInterval(compute, 60000)
    return () => clearInterval(interval)
  }, [exam, tasks])

  return result
}

export function useAllExamsCountdown(
  exams: ExamInfo[],
  tasks: StudyTask[],
): Record<string, ExamCountdownResult> {
  const [results, setResults] = useState<Record<string, ExamCountdownResult>>({})

  useEffect(() => {
    function compute() {
      const map: Record<string, ExamCountdownResult> = {}
      for (const exam of exams) {
        const now = Date.now()
        const examTime = new Date(exam.examDateTime).getTime()
        const diffMs = examTime - now
        const daysLeft = Math.max(0, Math.floor(diffMs / 86400000))
        const hoursLeft = Math.max(0, Math.floor((diffMs % 86400000) / 3600000))
        const isOverdue = diffMs < 0

        const subjectTasks = tasks.filter((t) => t.subjectId === exam.id)
        const totalTasks = subjectTasks.length
        const completedTasks = subjectTasks.filter((t) => t.status === 'completed').length
        const pendingTasks = totalTasks - completedTasks
        const tasksPerDay = daysLeft > 0 ? Math.ceil(pendingTasks / daysLeft) : pendingTasks
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        map[exam.id] = { daysLeft, hoursLeft, totalTasks, completedTasks, tasksPerDay, completionRate, isOverdue }
      }
      setResults(map)
    }

    compute()
    const interval = setInterval(compute, 60000)
    return () => clearInterval(interval)
  }, [exams, tasks])

  return results
}
