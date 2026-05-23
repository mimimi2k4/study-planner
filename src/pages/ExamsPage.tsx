import type { ExamInfo, StudyTask } from '../types'
import ExamForm from '../components/ExamForm/ExamForm'
import PageHeader from '../components/PageHeader'

interface Props { exams: ExamInfo[]; tasks: StudyTask[]; onAdd: (exam: ExamInfo) => void; onUpdate: (exam: ExamInfo) => void; onDelete: (id: string) => void }

export default function ExamsPage({ exams, tasks, onAdd, onUpdate, onDelete }: Props) {
  return (
    <div className="space-y-8">
      <PageHeader emoji="📚" title="Môn thi" subtitle="Thêm môn thi, ngày thi và điểm mục tiêu của bạn" />
      <ExamForm exams={exams} tasks={tasks} onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete} />
    </div>
  )
}
