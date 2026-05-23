import { useState } from 'react'
import { Plus, Trash2, AlertCircle, Clock, Target, Pencil, X } from 'lucide-react'
import type { ExamInfo, ExamFormat, StudyTask } from '../../types'
import { nanoid } from '../../utils/nanoid'
import { getSubjectColor } from '../../utils/colors'
import { useAllExamsCountdown } from '../../hooks/useExamCountdown'

const FORMAT_OPTIONS: { value: ExamFormat; label: string; emoji: string }[] = [
  { value: 'multiple_choice', label: 'Trắc nghiệm', emoji: '☑️' },
  { value: 'essay',           label: 'Tự luận',     emoji: '✍️' },
  { value: 'combined',        label: 'Kết hợp',     emoji: '📋' },
]

interface FormState { subjectName: string; examDateTime: string; examFormat: ExamFormat; targetScore: string }
const EMPTY: FormState = { subjectName: '', examDateTime: '', examFormat: 'multiple_choice', targetScore: '8' }
interface Errors { subjectName?: string; examDateTime?: string; targetScore?: string }
interface Props { exams: ExamInfo[]; tasks: StudyTask[]; onAdd: (e: ExamInfo) => void; onUpdate: (e: ExamInfo) => void; onDelete: (id: string) => void }

function validate(f: FormState): Errors {
  const e: Errors = {}
  if (!f.subjectName.trim()) e.subjectName = 'Vui lòng nhập tên môn thi'
  if (!f.examDateTime) e.examDateTime = 'Vui lòng chọn ngày giờ thi'
  else if (new Date(f.examDateTime) <= new Date()) e.examDateTime = 'Ngày thi phải là ngày trong tương lai'
  const s = Number(f.targetScore)
  if (isNaN(s) || s < 0 || s > 10) e.targetScore = 'Điểm mục tiêu phải từ 0 đến 10'
  return e
}

export default function ExamForm({ exams, tasks, onAdd, onUpdate, onDelete }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingColor, setEditingColor] = useState<string>('')
  const countdowns = useAllExamsCountdown(exams, tasks)

  function set(field: keyof FormState, value: string) {
    const next = { ...form, [field]: value }
    setForm(next)
    if (submitted) setErrors(validate(next))
  }

  function handleEdit(exam: ExamInfo) {
    setForm({
      subjectName: exam.subjectName,
      examDateTime: exam.examDateTime,
      examFormat: exam.examFormat,
      targetScore: String(exam.targetScore),
    })
    setEditingId(exam.id)
    setEditingColor(exam.color)
    setErrors({}); setSubmitted(false)
  }

  function handleCancel() {
    setForm(EMPTY); setErrors({}); setSubmitted(false)
    setEditingId(null); setEditingColor('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    if (editingId) {
      onUpdate({
        id: editingId, subjectName: form.subjectName.trim(),
        examDateTime: form.examDateTime, examFormat: form.examFormat,
        targetScore: Number(form.targetScore), color: editingColor,
      })
      setEditingId(null); setEditingColor('')
    } else {
      onAdd({
        id: nanoid(), subjectName: form.subjectName.trim(),
        examDateTime: form.examDateTime, examFormat: form.examFormat,
        targetScore: Number(form.targetScore), color: getSubjectColor(exams.length),
      })
    }
    setForm(EMPTY); setErrors({}); setSubmitted(false)
  }

  const score = Number(form.targetScore)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-7">

      {/* ── Form ── */}
      <div className="xl:col-span-3">
        <div className="card rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="px-7 py-5 flex items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, #f5f0ff, #ede9fe)', borderBottom: '1.5px solid #e9d5ff' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: editingId ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.6)', border: '1.5px solid #ddd6fe' }}>
                {editingId ? <Pencil size={20} className="text-violet-600" /> : <Plus size={20} className="text-violet-500" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg leading-none">
                  {editingId ? 'Chỉnh sửa môn thi' : 'Thêm môn thi mới'}
                </h3>
                <p className="text-slate-500 text-sm mt-0.5">
                  {editingId ? 'Cập nhật thông tin bên dưới.' : 'Điền thông tin bên dưới nhé!'}
                </p>
              </div>
            </div>
            {editingId && (
              <button type="button" onClick={handleCancel}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                <X size={15} /> Huỷ
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate
            style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Subject name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Tên môn thi *
              </label>
              <input type="text" value={form.subjectName} onChange={(e) => set('subjectName', e.target.value)}
                placeholder="VD: Toán cao cấp, Lập trình web..."
                style={{
                  height: 48, fontSize: 15,
                  ...(errors.subjectName ? { borderColor: '#fca5a5', background: '#fff7f7' } : {}),
                }} />
              {errors.subjectName && (
                <p className="text-xs text-red-500 flex items-center gap-1.5 mt-0.5">
                  <AlertCircle size={13} /> {errors.subjectName}
                </p>
              )}
            </div>

            {/* Date + Format */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Ngày giờ thi *
                </label>
                <input type="datetime-local" value={form.examDateTime}
                  onChange={(e) => set('examDateTime', e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{
                    height: 48, fontSize: 14,
                    ...(errors.examDateTime ? { borderColor: '#fca5a5', background: '#fff7f7' } : {}),
                  }} />
                {errors.examDateTime && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5 mt-0.5">
                    <AlertCircle size={13} /> {errors.examDateTime}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Hình thức thi
                </label>
                <div style={{ display: 'flex', gap: 10, height: 48 }}>
                  {FORMAT_OPTIONS.map((opt) => {
                    const active = form.examFormat === opt.value
                    return (
                      <button key={opt.value} type="button" onClick={() => set('examFormat', opt.value)}
                        style={{
                          flex: 1, height: 48, borderRadius: 12,
                          fontSize: 13, fontWeight: 700,
                          background: active ? '#f0ebff' : '#faf8ff',
                          border: `1.5px solid ${active ? '#7c3aed' : '#e9d5ff'}`,
                          color: active ? '#6d28d9' : '#94a3b8',
                          cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        }}>
                        <span style={{ fontSize: 15 }}>{opt.emoji}</span>
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Score */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Điểm mục tiêu —{' '}
                <span style={{ textTransform: 'none', fontSize: 16, fontWeight: 900, color: '#5b21b6' }}>
                  {form.targetScore}/10 ⭐
                </span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => {
                  const active = score === v
                  return (
                    <button key={v} type="button" onClick={() => set('targetScore', String(v))}
                      style={{
                        height: 56, borderRadius: 14,
                        fontWeight: 800, fontSize: 17,
                        background: active ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#faf8ff',
                        border: `1.5px solid ${active ? 'transparent' : '#e9d5ff'}`,
                        color: active ? '#fff' : '#94a3b8',
                        boxShadow: active ? '0 4px 12px rgba(124,58,237,0.40)' : 'none',
                        transform: active ? 'scale(1.06)' : 'scale(1)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                      {v}
                    </button>
                  )
                })}
              </div>
              {errors.targetScore && (
                <p className="text-xs text-red-500 flex items-center gap-1.5">
                  <AlertCircle size={13} /> {errors.targetScore}
                </p>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-full justify-center text-base"
              style={{ marginTop: 8, height: 52, borderRadius: 14, fontSize: 15, fontWeight: 700 }}>
              {editingId ? <><Pencil size={17} /> Cập nhật môn thi</> : <><Plus size={18} /> Thêm môn thi</>}
            </button>
          </form>
        </div>
      </div>

      {/* ── List ── */}
      <div className="xl:col-span-2">
        <div className="card rounded-3xl overflow-hidden" style={{ minHeight: 120 }}>
          {/* Panel header */}
          <div className="px-7 py-5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #f5f0ff, #ede9fe)', borderBottom: '1.5px solid #e9d5ff' }}>
            <div>
              <h2 className="font-black text-slate-800 text-xl leading-none">Danh sách môn thi</h2>
              <p className="text-slate-500 text-sm mt-1">
                {exams.length === 0 ? 'Chưa có môn nào được thêm' : `${exams.length} môn đã thêm`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>
              {exams.length}
            </div>
          </div>

          <div className="p-5">
            {exams.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3">
                <div className="text-4xl animate-float">📚</div>
                <p className="text-slate-500 text-base font-semibold">Chưa có môn thi nào</p>
                <p className="text-slate-400 text-sm">Điền form bên trái để thêm nào!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {exams.map((exam) => {
                  const cd = countdowns[exam.id]
                  const isEditing = editingId === exam.id
                  return (
                    <div key={exam.id}
                      className="rounded-2xl overflow-hidden flex group transition-all duration-150"
                      style={{
                        border: isEditing
                          ? `2px solid ${exam.color}`
                          : '1.5px solid rgba(139,92,246,0.10)',
                        boxShadow: isEditing
                          ? `0 0 0 3px ${exam.color}22, 0 4px 16px rgba(0,0,0,0.06)`
                          : '0 2px 8px rgba(109,40,217,0.05)',
                        background: '#fff',
                      }}>
                      {/* Left color strip */}
                      <div className="w-1.5 shrink-0" style={{ background: exam.color }} />

                      {/* Content */}
                      <div className="flex-1 p-5">
                        {/* Name + actions */}
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-black text-slate-800 leading-snug"
                            style={{ fontSize: 16 }}>
                            {exam.subjectName}
                          </p>
                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(exam)}
                              className="p-2 rounded-xl transition-all"
                              style={{ color: '#a78bfa', background: 'transparent' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#f5f0ff')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              title="Chỉnh sửa">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => onDelete(exam.id)}
                              className="p-2 rounded-xl transition-all"
                              style={{ color: '#cbd5e1', background: 'transparent' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#ef4444' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1' }}
                              title="Xoá">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Info chips */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                            style={{ fontSize: 13, fontWeight: 500, background: '#f8fafc', color: '#475569' }}>
                            <Clock size={12} />
                            {new Date(exam.examDateTime).toLocaleString('vi-VN', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                            style={{ fontSize: 13, fontWeight: 700, background: exam.color + '15', color: exam.color }}>
                            <Target size={12} />
                            {exam.targetScore}/10
                          </span>
                        </div>

                        {/* Countdown block */}
                        {cd && (
                          <div className="mt-3 rounded-xl px-4 py-3"
                            style={{ background: cd.isOverdue ? '#fff1f2' : exam.color + '0e' }}>
                            {cd.isOverdue ? (
                              <p className="text-sm font-semibold" style={{ color: '#be123c' }}>⚠️ Đã qua ngày thi</p>
                            ) : (
                              <>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-bold" style={{ fontSize: 14, color: exam.color }}>
                                    Còn {cd.daysLeft} ngày {cd.hoursLeft > 0 ? `${cd.hoursLeft} giờ` : ''}
                                  </span>
                                  {cd.totalTasks > 0 && (
                                    <span style={{ fontSize: 12, fontWeight: 700, color: exam.color }}>
                                      {cd.completionRate}% xong
                                    </span>
                                  )}
                                </div>
                                {cd.totalTasks > 0 && (
                                  <div className="h-2 rounded-full" style={{ background: exam.color + '22' }}>
                                    <div className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${cd.completionRate}%`, background: exam.color }} />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
