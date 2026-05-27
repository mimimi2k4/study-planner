import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, BookOpen, Upload, Pencil, Check, X, Loader2 } from 'lucide-react'
import type { Syllabus, Chapter, DifficultyLevel } from '../../types'
import type { SyllabusFormProps, FormErrors } from './types'
import { validateSyllabusForm } from './types'
import { nanoid } from '../../utils/nanoid'

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' }
const DIFFICULTY_SHORT: Record<DifficultyLevel, string> = { low: 'Thấp', medium: 'TB', high: 'Cao' }
const BADGE: Record<DifficultyLevel, string> = {
  low: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-700 bg-amber-50 border-amber-200',
  high: 'text-red-700 bg-red-50 border-red-200',
}

// Màu sắc theo cấp độ phân cấp
const LEVEL_COLORS = [
  { gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)', text: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
  { gradient: 'linear-gradient(135deg,#0891b2,#0e7490)', text: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { gradient: 'linear-gradient(135deg,#059669,#047857)', text: '#059669', bg: '#f0fdf4', border: '#a7f3d0' },
]

function getLevelColor(level: number) {
  return LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)]
}

function newChapter(level = 0): Chapter {
  return { id: nanoid(), name: '', difficulty: 'medium', importance: 'medium', level }
}

/** Tính số thứ tự hiển thị cho từng item theo cấp phân cấp */
function computeLabels(chapters: Chapter[]): string[] {
  const labels: string[] = []
  const counters: number[] = [0, 0, 0]
  const parentNums: (number | null)[] = [null, null, null]

  for (const c of chapters) {
    const lv = c.level ?? 0
    counters[lv] = (counters[lv] ?? 0) + 1
    // Reset cấp thấp hơn
    for (let i = lv + 1; i < counters.length; i++) counters[i] = 0

    if (lv === 0) {
      parentNums[0] = counters[0]
      labels.push(String(counters[0]))
    } else if (lv === 1) {
      labels.push(`${parentNums[0] ?? '?'}.${counters[1]}`)
    } else {
      labels.push(`${parentNums[0] ?? '?'}.${counters[1]}.${counters[2]}`)
    }
  }
  return labels
}

export default function SyllabusForm({
  syllabuses, exams, onAdd, onUpdate, onDelete,
  uploading, uploadMsg, importedChapters, onFileUpload,
}: SyllabusFormProps) {
  const [subjectId, setSubjectId] = useState('')
  const [chapters, setChapters] = useState<Chapter[]>([newChapter(0)])
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (importedChapters && importedChapters.length > 0) {
      setChapters(importedChapters)
    }
  }, [importedChapters])

  const isEditing = editingId !== null
  const selectedExam = exams.find((e) => e.id === subjectId)
  const availableExams = exams.filter((e) =>
    !syllabuses.some((s) => s.subjectId === e.id) ||
    (isEditing && syllabuses.find((s) => s.id === editingId)?.subjectId === e.id)
  )

  function resetForm() {
    setSubjectId(''); setChapters([newChapter(0)]); setErrors({})
    setSubmitted(false); setEditingId(null)
  }

  function handleStartEdit(s: Syllabus) {
    setEditingId(s.id); setSubjectId(s.subjectId)
    setChapters(s.chapters.map((c) => ({ ...c })))
    setErrors({}); setSubmitted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitted(true)
    const state = {
      subjectId,
      chapters: chapters.map((c) => ({ ...c, name: c.name.trim() })),
    }
    const errs = validateSyllabusForm(state); setErrors(errs)
    if (Object.keys(errs).length > 0) return
    if (isEditing) onUpdate(editingId!, state)
    else onAdd(state)
    resetForm()
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileUpload(file)
    e.target.value = ''
  }

  function changeChapter(id: string, field: keyof Chapter, value: string) {
    setChapters((cs) => {
      const updated = cs.map((c) => (c.id === id ? { ...c, [field]: value } : c))
      if (submitted) setErrors(validateSyllabusForm({ subjectId, chapters: updated }))
      return updated
    })
  }

  /** Thêm chương con ngay sau chương cha (và sau tất cả con của nó) */
  function addSubChapter(parentId: string) {
    setChapters((cs) => {
      const idx = cs.findIndex((c) => c.id === parentId)
      if (idx === -1) return cs
      const parentLevel = cs[idx].level ?? 0
      let insertAt = idx + 1
      while (insertAt < cs.length && (cs[insertAt].level ?? 0) > parentLevel) insertAt++
      const sub = newChapter(parentLevel + 1)
      return [...cs.slice(0, insertAt), sub, ...cs.slice(insertAt)]
    })
  }

  /** Xoá chapter và tất cả con của nó */
  function deleteChapterWithChildren(id: string) {
    setChapters((cs) => {
      const idx = cs.findIndex((c) => c.id === id)
      if (idx === -1) return cs
      const parentLevel = cs[idx].level ?? 0
      let endIdx = idx + 1
      while (endIdx < cs.length && (cs[endIdx].level ?? 0) > parentLevel) endIdx++
      return [...cs.slice(0, idx), ...cs.slice(endIdx)]
    })
  }

  const mainChaptersCount = chapters.filter((c) => (c.level ?? 0) === 0).length
  const labels = computeLabels(chapters)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
      {/* ── Form (3/5) ── */}
      <div className="xl:col-span-3">
        <div className="bg-white rounded-3xl shadow-sm border border-white overflow-hidden">
          {/* Card header */}
          <div className="px-7 py-5 flex items-center justify-between"
            style={{ background: isEditing ? 'linear-gradient(135deg,#fdf4ff,#f0fdf4)' : 'linear-gradient(135deg,#eef2ff,#f5f3ff)' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                style={{ background: isEditing ? 'linear-gradient(135deg,#8b5cf6,#06b6d4)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                {isEditing ? <Pencil size={20} className="text-white" /> : <Plus size={22} className="text-white" />}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {isEditing ? 'Chỉnh sửa đề cương' : 'Thêm đề cương môn học'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {isEditing
                    ? `Đang sửa: ${selectedExam?.subjectName}`
                    : 'Import file → tự động phân cấp chương lớn & chương con'}
                </p>
              </div>
            </div>
            {isEditing && (
              <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-all">
                <X size={18} />
              </button>
            )}
          </div>

          <div className="p-7">
            {exams.length === 0 ? (
              <div className="text-center py-14">
                <BookOpen size={40} className="mx-auto text-indigo-200 mb-4" />
                <p className="text-slate-400">Chưa có môn thi. Hãy thêm ở trang <strong>Môn thi</strong> trước.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {/* Subject select */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Chọn môn học <span className="text-red-500">*</span>
                  </label>
                  <select value={subjectId} disabled={isEditing}
                    onChange={(e) => { setSubjectId(e.target.value); if (submitted) setErrors(validateSyllabusForm({ subjectId: e.target.value, chapters })) }}
                    className={`w-full px-5 py-3.5 rounded-2xl border-2 text-base font-medium transition-all ${
                      errors.subjectName ? 'border-red-400 bg-red-50'
                      : 'border-slate-100 bg-slate-50 hover:border-indigo-200 focus:border-indigo-400 focus:bg-white'
                    } ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <option value="">-- Chọn môn thi --</option>
                    {availableExams.map((e) => <option key={e.id} value={e.id}>{e.subjectName}</option>)}
                  </select>
                  {errors.subjectName && <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5"><AlertCircle size={14} />{errors.subjectName}</p>}
                </div>

                {/* ── File import ── */}
                <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                      {uploading ? <Loader2 size={18} className="text-indigo-500 animate-spin" /> : <Upload size={18} className="text-indigo-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-indigo-800 text-sm">Import từ file — AI phân cấp tự động</p>
                      <p className="text-indigo-500 text-xs mt-0.5">
                        Hỗ trợ&nbsp;
                        <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">.pdf</code>&nbsp;
                        <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">.docx</code>&nbsp;
                        <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">.txt</code>&nbsp;
                        <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">.json</code>
                        &nbsp;— AI tự nhận diện chương lớn / chương con
                      </p>
                      {uploadMsg && (
                        <p className={`text-xs mt-1.5 font-semibold ${uploadMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {uploadMsg.type === 'success' ? '✓' : '✗'} {uploadMsg.text}
                        </p>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.json" className="hidden" onChange={handleFileSelected} />
                    <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
                      className="shrink-0 px-4 py-2 font-bold text-sm rounded-xl text-white transition-all disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                      {uploading ? 'Đang đọc...' : 'Chọn file'}
                    </button>
                  </div>
                </div>

                {/* ── Chapter & Sub-chapter list ── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        Cấu trúc chương học <span className="text-red-500">*</span>
                      </p>
                      <p className="text-xs font-semibold" style={{ color: '#6366f1' }}>
                        {mainChaptersCount} chương lớn ·{' '}
                        {chapters.filter((c) => (c.level ?? 0) === 1).length} chương con ·{' '}
                        {chapters.filter((c) => (c.level ?? 0) >= 2).length} mục nhỏ
                      </p>
                    </div>
                    <button type="button"
                      onClick={() => setChapters((cs) => [...cs, newChapter(0)])}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl transition-all border border-indigo-200">
                      <Plus size={14} /> Thêm chương
                    </button>
                  </div>

                  {errors.chapters && (
                    <p className="mb-2 text-sm text-red-500 flex items-center gap-1.5"><AlertCircle size={14} />{errors.chapters}</p>
                  )}

                  <div className="max-h-[560px] overflow-y-auto pr-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {chapters.map((c, idx) => {
                      const lv = c.level ?? 0
                      const color = getLevelColor(lv)
                      const label = labels[idx]
                      const hasError = !!errors.chapterNames?.[c.id]

                      /* ── Chương lớn (level 0) ── */
                      if (lv === 0) {
                        return (
                          <div key={c.id}
                            className={`rounded-2xl border-2 transition-all ${
                              hasError ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50 hover:border-indigo-200 focus-within:border-indigo-300'
                            }`}>
                            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                              <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                                style={{ background: color.gradient }}>
                                {label}
                              </span>
                              <input type="text" value={c.name}
                                onChange={(e) => changeChapter(c.id, 'name', e.target.value)}
                                placeholder={`Tên chương ${label}...`}
                                className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-100 bg-white text-base font-medium focus:border-indigo-400 outline-none transition-all min-w-0" />
                              <button type="button" onClick={() => addSubChapter(c.id)}
                                title="Thêm chương con"
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl shrink-0 transition-all border"
                                style={{ background: color.bg, color: color.text, borderColor: color.border }}>
                                <Plus size={11} /> Mục con
                              </button>
                              <button type="button"
                                onClick={() => deleteChapterWithChildren(c.id)}
                                disabled={mainChaptersCount === 1 && chapters.length === 1}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl disabled:opacity-20 transition-all shrink-0">
                                <Trash2 size={15} />
                              </button>
                            </div>

                            {hasError && (
                              <p className="px-4 pb-2 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={11} />{errors.chapterNames![c.id]}
                              </p>
                            )}

                            <div className="grid grid-cols-2 gap-3 px-4 pb-4 ml-11">
                              {(['difficulty', 'importance'] as const).map((field) => (
                                <div key={field}>
                                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                                    {field === 'difficulty' ? 'Độ khó' : 'Tầm quan trọng'}
                                  </label>
                                  <select value={c[field]}
                                    onChange={(e) => changeChapter(c.id, field, e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-indigo-400 outline-none transition-all">
                                    {(Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[]).map((d) => (
                                      <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }

                      /* ── Chương con / mục nhỏ (level 1, 2) ── */
                      return (
                        <div key={c.id}
                          className="flex items-center gap-2.5 rounded-xl border transition-all"
                          style={{
                            marginLeft: lv * 24,
                            background: hasError ? '#fff1f2' : color.bg,
                            borderColor: hasError ? '#fecdd3' : color.border,
                            padding: '7px 12px',
                          }}>
                          {/* Level label */}
                          <span className="text-xs font-black shrink-0 min-w-[2rem] text-right"
                            style={{ color: color.text }}>
                            {label}
                          </span>

                          <input type="text" value={c.name}
                            onChange={(e) => changeChapter(c.id, 'name', e.target.value)}
                            placeholder={`Mục ${label}...`}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border bg-white text-sm font-medium outline-none transition-all min-w-0"
                            style={{ borderColor: hasError ? '#fca5a5' : '#e2e8f0' }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = color.text)}
                            onBlur={(e) => (e.currentTarget.style.borderColor = hasError ? '#fca5a5' : '#e2e8f0')} />

                          {/* Compact difficulty/importance with labels */}
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">KH</span>
                            <select value={c.difficulty}
                              onChange={(e) => changeChapter(c.id, 'difficulty', e.target.value)}
                              className="px-2 py-1.5 rounded-lg border border-slate-100 bg-white text-xs font-semibold outline-none focus:border-indigo-300 transition-colors">
                              {(Object.keys(DIFFICULTY_SHORT) as DifficultyLevel[]).map((d) => (
                                <option key={d} value={d}>{DIFFICULTY_SHORT[d]}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">QT</span>
                            <select value={c.importance}
                              onChange={(e) => changeChapter(c.id, 'importance', e.target.value)}
                              className="px-2 py-1.5 rounded-lg border border-slate-100 bg-white text-xs font-semibold outline-none focus:border-indigo-300 transition-colors">
                              {(Object.keys(DIFFICULTY_SHORT) as DifficultyLevel[]).map((d) => (
                                <option key={d} value={d}>{DIFFICULTY_SHORT[d]}</option>
                              ))}
                            </select>
                          </div>

                          {lv < 2 && (
                            <button type="button" onClick={() => addSubChapter(c.id)}
                              title="Thêm mục con"
                              className="p-1.5 rounded-lg transition-all shrink-0"
                              style={{ color: color.text, background: 'transparent' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'white')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                              <Plus size={12} />
                            </button>
                          )}

                          <button type="button" onClick={() => deleteChapterWithChildren(c.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button type="submit"
                    className="flex-1 flex items-center justify-center gap-2 py-4 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all text-base"
                    style={{ background: isEditing ? 'linear-gradient(135deg,#8b5cf6,#06b6d4)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                    <Check size={20} />
                    {isEditing ? 'Cập nhật đề cương' : 'Lưu đề cương'}
                  </button>
                  {isEditing && (
                    <button type="button" onClick={resetForm}
                      className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all">
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Saved list (2/5) ── */}
      <div className="xl:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card rounded-3xl overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', borderBottom: '1.5px solid #e0e7ff' }}>
            <div>
              <h2 className="font-black text-slate-800 text-xl leading-none">Đề cương đã lưu</h2>
              <p className="text-slate-500 text-sm mt-1">
                {syllabuses.length === 0 ? 'Chưa có đề cương nào' : `${syllabuses.length} môn đã nhập`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', boxShadow: '0 4px 12px rgba(79,70,229,0.35)' }}>
              {syllabuses.length}
            </div>
          </div>

          <div className="p-5">
            {syllabuses.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3">
                <BookOpen size={36} className="text-indigo-200" />
                <p className="text-slate-400 font-medium">Chưa có đề cương nào</p>
                <p className="text-slate-400 text-sm">Điền form bên trái để thêm!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {syllabuses.map((s) => {
                  const exam = exams.find((e) => e.id === s.subjectId)
                  const isOpen = expanded === s.id
                  const isCurrentEdit = editingId === s.id
                  const savedLabels = computeLabels(s.chapters)
                  const mainCount = s.chapters.filter((c) => (c.level ?? 0) === 0).length
                  const subCount = s.chapters.filter((c) => (c.level ?? 0) > 0).length
                  return (
                    <div key={s.id}
                      className="rounded-2xl overflow-hidden transition-all"
                      style={{
                        border: isCurrentEdit ? '2px solid #7c3aed' : '1.5px solid rgba(139,92,246,0.12)',
                        boxShadow: isCurrentEdit ? '0 0 0 3px rgba(124,58,237,0.12)' : '0 2px 6px rgba(109,40,217,0.05)',
                        background: '#fff',
                      }}>
                      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                        onClick={() => setExpanded(isOpen ? null : s.id)}>
                        <div className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ background: exam?.color ?? '#6366f1' }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-[15px] truncate">{s.subjectName}</p>
                          <p className="text-sm text-slate-400 mt-0.5">
                            {mainCount} chương lớn
                            {subCount > 0 && <> · <span className="text-indigo-400">{subCount} mục con</span></>}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); handleStartEdit(s) }}
                            className="p-2 rounded-xl transition-all"
                            style={{ color: '#a78bfa' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f0ff')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            title="Chỉnh sửa">
                            <Pencil size={14} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(s.id) }}
                            className="p-2 rounded-xl transition-all"
                            style={{ color: '#cbd5e1' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#ef4444' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1' }}>
                            <Trash2 size={14} />
                          </button>
                          {isOpen
                            ? <ChevronUp size={14} className="text-slate-300 ml-1" />
                            : <ChevronDown size={14} className="text-slate-300 ml-1" />}
                        </div>
                      </div>

                      {isOpen && (
                        <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 16px 14px', background: '#fafafa' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {s.chapters.map((c, i) => {
                              const lv = c.level ?? 0
                              const color = getLevelColor(lv)
                              const lbl = savedLabels[i]
                              return (
                                <div key={c.id}
                                  className="flex items-center gap-2"
                                  style={{ marginLeft: lv * 20 }}>
                                  {lv === 0 ? (
                                    <span className="w-6 h-6 rounded-lg text-white text-xs font-black flex items-center justify-center shrink-0"
                                      style={{ background: color.gradient }}>
                                      {lbl}
                                    </span>
                                  ) : (
                                    <span className="text-xs font-bold shrink-0 w-8 text-right"
                                      style={{ color: color.text }}>
                                      {lbl}
                                    </span>
                                  )}
                                  <span className={`flex-1 min-w-0 truncate ${lv === 0 ? 'text-slate-700 font-semibold text-sm' : 'text-slate-500 text-xs'}`}>
                                    {c.name}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[10px] text-slate-400 font-semibold">KH</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-bold ${BADGE[c.difficulty]}`}>
                                      {DIFFICULTY_SHORT[c.difficulty]}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[10px] text-slate-400 font-semibold">QT</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-bold ${BADGE[c.importance]}`}>
                                      {DIFFICULTY_SHORT[c.importance]}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="rounded-2xl p-5 text-sm" style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
          <p className="font-bold text-amber-800 mb-3">📊 Phân cấp chương học</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="text-xs text-amber-700">
            {[
              { color: LEVEL_COLORS[0], label: 'Chương lớn', example: 'Chương 1: Cấu trúc dữ liệu' },
              { color: LEVEL_COLORS[1], label: 'Chương con', example: '1.1. Mảng và danh sách' },
              { color: LEVEL_COLORS[2], label: 'Mục nhỏ', example: '1.1.1. Mảng một chiều' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md shrink-0"
                  style={{ background: item.color.gradient }} />
                <div>
                  <span className="font-bold">{item.label}</span>
                  <span className="text-amber-600 ml-1">— {item.example}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
