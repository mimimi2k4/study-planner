import { useState, useRef } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, BookOpen, Upload, Pencil, Check, X, Loader2 } from 'lucide-react'
import type { Syllabus, Chapter, DifficultyLevel, ExamInfo } from '../../types'
import { nanoid } from '../../utils/nanoid'
import { parseFileToChapters } from '../../utils/fileParser'

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' }
const BADGE: Record<DifficultyLevel, string> = {
  low: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-700 bg-amber-50 border-amber-200',
  high: 'text-red-700 bg-red-50 border-red-200',
}

interface ChapterInput { id: string; name: string; difficulty: DifficultyLevel; importance: DifficultyLevel }
interface FormErrors { subjectName?: string; chapters?: string; chapterNames?: Record<string, string> }
interface Props {
  syllabuses: Syllabus[]; exams: ExamInfo[]
  onAdd: (s: Syllabus) => void; onUpdate: (s: Syllabus) => void; onDelete: (id: string) => void
}

function newChapter(name = ''): ChapterInput {
  return { id: nanoid(), name, difficulty: 'medium', importance: 'medium' }
}

export default function SyllabusForm({ syllabuses, exams, onAdd, onUpdate, onDelete }: Props) {
  const [subjectId, setSubjectId] = useState('')
  const [chapters, setChapters] = useState<ChapterInput[]>([newChapter()])
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const isEditing = editingId !== null
  const selectedExam = exams.find((e) => e.id === subjectId)
  const availableExams = exams.filter((e) =>
    !syllabuses.some((s) => s.subjectId === e.id) ||
    (isEditing && syllabuses.find((s) => s.id === editingId)?.subjectId === e.id)
  )

  function validate(chs = chapters): FormErrors {
    const errs: FormErrors = {}
    if (!subjectId) errs.subjectName = 'Vui lòng chọn môn học'
    if (chs.length === 0) errs.chapters = 'Cần ít nhất một chương'
    const chapterNames: Record<string, string> = {}
    chs.forEach((c) => { if (!c.name.trim()) chapterNames[c.id] = 'Tên chương không được để trống' })
    if (Object.keys(chapterNames).length > 0) errs.chapterNames = chapterNames
    return errs
  }

  function resetForm() {
    setSubjectId(''); setChapters([newChapter()]); setErrors({})
    setSubmitted(false); setEditingId(null); setUploadMsg(null)
  }

  function handleStartEdit(s: Syllabus) {
    setEditingId(s.id); setSubjectId(s.subjectId)
    setChapters(s.chapters.map((c) => ({ ...c })))
    setErrors({}); setSubmitted(false); setUploadMsg(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitted(true)
    const errs = validate(); setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const built: Syllabus = {
      id: editingId ?? nanoid(), subjectId,
      subjectName: selectedExam!.subjectName,
      chapters: chapters.map((c): Chapter => ({ id: c.id, name: c.name.trim(), difficulty: c.difficulty, importance: c.importance })),
    }
    if (isEditing) onUpdate(built)
    else onAdd(built)
    resetForm()
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setUploadMsg(null)
    try {
      const parsed = await parseFileToChapters(file)
      if (parsed.length === 0) {
        setUploadMsg({ type: 'error', text: `Không đọc được chương nào từ file "${file.name}". Hãy kiểm tra định dạng.` })
      } else {
        setChapters(parsed)
        setUploadMsg({ type: 'success', text: `Đã import ${parsed.length} chương từ "${file.name}"` })
      }
    } catch (err) {
      setUploadMsg({ type: 'error', text: `Lỗi đọc file: ${(err as Error).message}` })
    } finally {
      setUploading(false)
    }
    e.target.value = ''
  }

  function changeChapter(id: string, field: keyof ChapterInput, value: string) {
    setChapters((cs) => {
      const updated = cs.map((c) => (c.id === id ? { ...c, [field]: value } : c))
      if (submitted) setErrors(validate(updated))
      return updated
    })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
      {/* ── Form (3/5) ── */}
      <div className="xl:col-span-3">
        <div className="bg-white rounded-3xl shadow-sm border border-white overflow-hidden">
          {/* Card header */}
          <div className="px-7 py-5 flex items-center justify-between"
            style={{ background: isEditing ? 'linear-gradient(135deg, #fdf4ff, #f0fdf4)' : 'linear-gradient(135deg, #eef2ff, #f5f3ff)' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                style={{ background: isEditing ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                {isEditing ? <Pencil size={20} className="text-white" /> : <Plus size={22} className="text-white" />}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {isEditing ? 'Chỉnh sửa đề cương' : 'Thêm đề cương môn học'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {isEditing ? `Đang sửa: ${selectedExam?.subjectName}` : 'Nhập danh sách chương và mức độ quan trọng'}
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
                    onChange={(e) => { setSubjectId(e.target.value); if (submitted) setErrors(validate()) }}
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
                      <p className="font-bold text-indigo-800 text-sm">Import từ file</p>
                      <p className="text-indigo-500 text-xs mt-0.5">
                        Hỗ trợ&nbsp;
                        <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">.pdf</code>&nbsp;
                        <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">.docx</code>&nbsp;
                        <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">.txt</code>&nbsp;
                        <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">.json</code>
                        &nbsp;— Mỗi dòng/mục sẽ trở thành 1 chương
                      </p>
                      {uploadMsg && (
                        <p className={`text-xs mt-1.5 font-semibold ${uploadMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {uploadMsg.type === 'success' ? '✓' : '✗'} {uploadMsg.text}
                        </p>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.json" className="hidden" onChange={handleFileUpload} />
                    <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
                      className="shrink-0 px-4 py-2 font-bold text-sm rounded-xl text-white transition-all disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                      {uploading ? 'Đang đọc...' : 'Chọn file'}
                    </button>
                  </div>
                </div>

                {/* ── Chapters ── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        Danh sách chương <span className="text-red-500">*</span>
                      </p>
                      <p className="text-xs text-indigo-500 font-semibold">{chapters.length} chương</p>
                    </div>
                    <button type="button" onClick={() => setChapters((cs) => [...cs, newChapter()])}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl transition-all border border-indigo-200">
                      <Plus size={14} /> Thêm chương
                    </button>
                  </div>

                  {errors.chapters && <p className="mb-2 text-sm text-red-500 flex items-center gap-1.5"><AlertCircle size={14} />{errors.chapters}</p>}

                  <div className="max-h-[460px] overflow-y-auto pr-1" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {chapters.map((c, idx) => (
                      <div key={c.id}
                        className={`rounded-2xl border-2 transition-all ${
                          errors.chapterNames?.[c.id] ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50 hover:border-indigo-200 focus-within:border-indigo-300'
                        }`}>
                        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                            {idx + 1}
                          </span>
                          <input type="text" value={c.name}
                            onChange={(e) => changeChapter(c.id, 'name', e.target.value)}
                            placeholder={`Tên chương ${idx + 1}...`}
                            className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-100 bg-white text-base font-medium focus:border-indigo-400 outline-none transition-all" />
                          <button type="button" onClick={() => setChapters((cs) => cs.filter((x) => x.id !== c.id))}
                            disabled={chapters.length === 1}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl disabled:opacity-20 transition-all">
                            <Trash2 size={15} />
                          </button>
                        </div>
                        {errors.chapterNames?.[c.id] && (
                          <p className="px-4 pb-2 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.chapterNames[c.id]}</p>
                        )}
                        <div className="grid grid-cols-2 gap-3 px-4 pb-4 ml-11">
                          {(['difficulty', 'importance'] as const).map((field) => (
                            <div key={field}>
                              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                                {field === 'difficulty' ? 'Độ khó' : 'Tầm quan trọng'}
                              </label>
                              <select value={c[field]} onChange={(e) => changeChapter(c.id, field, e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border-2 border-slate-100 bg-white text-sm font-semibold focus:border-indigo-400 outline-none transition-all">
                                {(Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[]).map((d) => (
                                  <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button type="submit"
                    className="flex-1 flex items-center justify-center gap-2 py-4 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all text-base"
                    style={{ background: isEditing ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
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

        {/* Panel card */}
        <div className="card rounded-3xl overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)', borderBottom: '1.5px solid #e0e7ff' }}>
            <div>
              <h2 className="font-black text-slate-800 text-xl leading-none">Đề cương đã lưu</h2>
              <p className="text-slate-500 text-sm mt-1">
                {syllabuses.length === 0 ? 'Chưa có đề cương nào' : `${syllabuses.length} môn đã nhập`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', boxShadow: '0 4px 12px rgba(79,70,229,0.35)' }}>
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
                          <p className="text-sm text-slate-400 mt-0.5">{s.chapters.length} chương</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); handleStartEdit(s) }}
                            className="p-2 rounded-xl transition-all"
                            style={{ color: '#a78bfa' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f5f0ff')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            title="Chỉnh sửa">
                            <Pencil size={14} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(s.id) }}
                            className="p-2 rounded-xl transition-all"
                            style={{ color: '#cbd5e1' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#ef4444' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1' }}>
                            <Trash2 size={14} />
                          </button>
                          {isOpen
                            ? <ChevronUp size={14} className="text-slate-300 ml-1" />
                            : <ChevronDown size={14} className="text-slate-300 ml-1" />}
                        </div>
                      </div>

                      {isOpen && (
                        <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 20px 14px', background: '#fafafa' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {s.chapters.map((c, i) => (
                              <div key={c.id} className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-lg text-white text-xs font-black flex items-center justify-center shrink-0"
                                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>{i + 1}</span>
                                <span className="flex-1 text-slate-700 font-semibold text-sm">{c.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${BADGE[c.difficulty]}`}>{DIFFICULTY_LABELS[c.difficulty]}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${BADGE[c.importance]}`}>{DIFFICULTY_LABELS[c.importance]}</span>
                              </div>
                            ))}
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

        {/* Import hint */}
        <div className="rounded-2xl p-5 text-sm" style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
          <p className="font-bold text-amber-800 mb-3">📄 Định dạng file import</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="text-xs text-amber-700">
            <div>
              <span className="font-bold">.txt / .pdf / .docx</span> — mỗi dòng = 1 chương:
              <pre className="mt-2 bg-amber-100 rounded-xl p-3 font-mono text-amber-800 leading-relaxed">Chương 1: HTML & CSS{'\n'}Chương 2: JavaScript{'\n'}Chương 3: React</pre>
            </div>
            <div>
              <span className="font-bold">.json</span> — mảng chuỗi hoặc object:
              <pre className="mt-2 bg-amber-100 rounded-xl p-3 font-mono text-amber-800 leading-relaxed">['HTML', 'CSS', 'JS']{'\n'}[{'{'}name:'HTML',difficulty:'low'{'}'}]</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
