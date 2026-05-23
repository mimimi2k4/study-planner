import type { Syllabus, ExamInfo } from '../types'
import SyllabusForm from '../components/SyllabusForm/SyllabusForm'
import PageHeader from '../components/PageHeader'

interface Props { syllabuses: Syllabus[]; exams: ExamInfo[]; onAdd: (s: Syllabus) => void; onUpdate: (s: Syllabus) => void; onDelete: (id: string) => void }

export default function SyllabusPage({ syllabuses, exams, onAdd, onUpdate, onDelete }: Props) {
  return (
    <div className="space-y-8">
      <PageHeader emoji="📝" title="Đề cương môn học" subtitle="Nhập chương học, độ khó — hỗ trợ import file PDF/Word 📎" />
      <SyllabusForm syllabuses={syllabuses} exams={exams} onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete} />
    </div>
  )
}
