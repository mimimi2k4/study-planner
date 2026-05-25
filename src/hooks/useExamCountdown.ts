import { useState, useEffect } from 'react'
import type { ExamInfo, StudyTask, ExamCountdownResult } from '../types'

function computeCountdown(exam: ExamInfo, tasks: StudyTask[]): ExamCountdownResult {
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

  return { daysLeft, hoursLeft, totalTasks, completedTasks, tasksPerDay, completionRate, isOverdue }
}

export function useExamCountdown(
  exam: ExamInfo | null,
  tasks: StudyTask[],
): ExamCountdownResult | null {
  const [result, setResult] = useState<ExamCountdownResult | null>(null)

  // Cảnh báo nếu chưa nhập ngày thi hoặc ngày thi đã qua
  useEffect(() => {
    if (!exam || !exam.examDateTime) {
      console.warn("🔔 Nhắc nhở: Bạn chưa nhập thông tin ngày thi (examDate). Vui lòng cập nhật để AI có thể lên lịch.");
      return;
    }
    const diffMs = new Date(exam.examDateTime).getTime() - Date.now();
    if (diffMs < 0) {
      console.warn(`⚠️ Cảnh báo: Ngày thi của môn "${exam.subjectName}" đã qua!`);
    }
  }, [exam]);

  useEffect(() => {
    if (!exam || !exam.examDateTime) { setResult(null); return }
    const run = () => setResult(computeCountdown(exam, tasks))
    run()
    const interval = setInterval(run, 60000)
    return () => clearInterval(interval)
  }, [exam, tasks])

  return result
}

export function useAllExamsCountdown(
  exams: ExamInfo[],
  tasks: StudyTask[],
): Record<string, ExamCountdownResult> {
  const [results, setResults] = useState<Record<string, ExamCountdownResult>>({})

  // Cảnh báo chung cho tất cả các môn thi
  useEffect(() => {
    exams.forEach(exam => {
      if (!exam.examDateTime) {
        console.warn(`🔔 Nhắc nhở: Môn "${exam.subjectName}" chưa có ngày thi hợp lệ.`);
        return;
      }
      const diffMs = new Date(exam.examDateTime).getTime() - Date.now();
      if (diffMs < 0) {
        console.warn(`⚠️ Cảnh báo: Ngày thi của môn "${exam.subjectName}" đã qua!`);
      }
    });
  }, [exams]);

  useEffect(() => {
    const run = () => {
      const map: Record<string, ExamCountdownResult> = {}
      for (const exam of exams) {
        if (exam.examDateTime) {
          map[exam.id] = computeCountdown(exam, tasks)
        }
      }
      setResults(map)
    }
    run()
    const interval = setInterval(run, 60000)
    return () => clearInterval(interval)
  }, [exams, tasks])

  return results
}
