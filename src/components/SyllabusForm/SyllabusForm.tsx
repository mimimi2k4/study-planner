import { useState, useRef, useEffect } from "react";
import {
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    BookOpen,
    Upload,
    Pencil,
    Check,
    X,
    Loader2,
    BarChart3,
} from "lucide-react";
import type { Syllabus, Chapter, DifficultyLevel } from "../../types";
import type { SyllabusFormProps, FormErrors } from "./types";
import { validateSyllabusForm } from "./types";
import { nanoid } from "../../utils/nanoid";

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
    low: "Thấp",
    medium: "Trung bình",
    high: "Cao",
};
const DIFFICULTY_SHORT: Record<DifficultyLevel, string> = {
    low: "Thấp",
    medium: "TB",
    high: "Cao",
};
const BADGE: Record<DifficultyLevel, string> = {
    low: "text-emerald-700 bg-emerald-50 border-emerald-200",
    medium: "text-amber-700 bg-amber-50 border-amber-200",
    high: "text-red-700 bg-red-50 border-red-200",
};

// Màu sắc theo cấp độ phân cấp
const LEVEL_COLORS = [
    { gradient: "#059669", text: "#059669", bg: "#ecfdf5", border: "#a7f3d0" }, // emerald-600
    { gradient: "#0284c7", text: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" }, // sky-600
    { gradient: "#0d9488", text: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" }, // teal-600
];

function getLevelColor(level: number) {
    return LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)];
}

function newChapter(level = 0): Chapter {
    return { id: nanoid(), name: "", difficulty: "medium", importance: "medium", level };
}

/** Tính số thứ tự hiển thị cho từng item theo cấp phân cấp */
function computeLabels(chapters: Chapter[]): string[] {
    const labels: string[] = [];
    const counters: number[] = [0, 0, 0];
    const parentNums: (number | null)[] = [null, null, null];

    for (const c of chapters) {
        const lv = c.level ?? 0;
        counters[lv] = (counters[lv] ?? 0) + 1;
        // Reset cấp thấp hơn
        for (let i = lv + 1; i < counters.length; i++) counters[i] = 0;

        if (lv === 0) {
            parentNums[0] = counters[0];
            labels.push(String(counters[0]));
        } else if (lv === 1) {
            labels.push(`${parentNums[0] ?? "?"}.${counters[1]}`);
        } else {
            labels.push(`${parentNums[0] ?? "?"}.${counters[1]}.${counters[2]}`);
        }
    }
    return labels;
}

export default function SyllabusForm({
    syllabuses,
    exams,
    onAdd,
    onUpdate,
    onDelete,
    uploading,
    uploadMsg,
    importedChapters,
    onFileUpload,
    onClearUpload,
}: SyllabusFormProps) {
    const [subjectId, setSubjectId] = useState("");
    const [chapters, setChapters] = useState<Chapter[]>([newChapter(0)]);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitted, setSubmitted] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (importedChapters && importedChapters.length > 0) {
            setChapters(importedChapters);
        }
    }, [importedChapters]);

    const isEditing = editingId !== null;
    const selectedExam = exams.find((e) => e.id === subjectId);
    const availableExams = exams.filter(
        (e) =>
            !syllabuses.some((s) => s.subjectId === e.id) ||
            (isEditing && syllabuses.find((s) => s.id === editingId)?.subjectId === e.id)
    );

    function resetForm() {
        setSubjectId("");
        setChapters([newChapter(0)]);
        setErrors({});
        setSubmitted(false);
        setEditingId(null);
        onClearUpload?.();
    }

    function handleStartEdit(s: Syllabus) {
        setEditingId(s.id);
        setSubjectId(s.subjectId);
        setChapters(s.chapters.map((c) => ({ ...c })));
        setErrors({});
        setSubmitted(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitted(true);
        const state = {
            subjectId,
            chapters: chapters.map((c) => ({ ...c, name: c.name.trim() })),
        };
        const errs = validateSyllabusForm(state);
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        if (isEditing) onUpdate(editingId!, state);
        else onAdd(state);
        resetForm();
    }

    function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) onFileUpload(file);
        e.target.value = "";
    }

    function changeChapter(id: string, field: keyof Chapter, value: string) {
        setChapters((cs) => {
            const updated = cs.map((c) => (c.id === id ? { ...c, [field]: value } : c));
            if (submitted) setErrors(validateSyllabusForm({ subjectId, chapters: updated }));
            return updated;
        });
    }

    /** Thêm chương con ngay sau chương cha (và sau tất cả con của nó) */
    function addSubChapter(parentId: string) {
        setChapters((cs) => {
            const idx = cs.findIndex((c) => c.id === parentId);
            if (idx === -1) return cs;
            const parentLevel = cs[idx].level ?? 0;
            let insertAt = idx + 1;
            while (insertAt < cs.length && (cs[insertAt].level ?? 0) > parentLevel) insertAt++;
            const sub = newChapter(parentLevel + 1);
            return [...cs.slice(0, insertAt), sub, ...cs.slice(insertAt)];
        });
    }

    /** Xoá chapter và tất cả con của nó */
    function deleteChapterWithChildren(id: string) {
        setChapters((cs) => {
            const idx = cs.findIndex((c) => c.id === id);
            if (idx === -1) return cs;
            const parentLevel = cs[idx].level ?? 0;
            let endIdx = idx + 1;
            while (endIdx < cs.length && (cs[endIdx].level ?? 0) > parentLevel) endIdx++;
            return [...cs.slice(0, idx), ...cs.slice(endIdx)];
        });
    }

    const mainChaptersCount = chapters.filter((c) => (c.level ?? 0) === 0).length;
    const labels = computeLabels(chapters);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* ── Form (3/5) ── */}
            <div className="xl:col-span-3">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Card header */}
                    <div className="px-8 py-6 flex items-center justify-between bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${isEditing ? "bg-amber-50 border-amber-200 text-amber-500" : "bg-emerald-50 border-emerald-100 text-emerald-600"}`}
                            >
                                {isEditing ? <Pencil size={24} /> : <Plus size={24} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-xl leading-none">
                                    {isEditing ? "Chỉnh sửa đề cương" : "Thêm đề cương môn học"}
                                </h3>
                                <p className="text-slate-500 font-medium text-sm mt-1.5">
                                    {isEditing
                                        ? `Đang sửa: ${selectedExam?.subjectName}`
                                        : "Import file → tự động phân cấp chương lớn & chương con"}
                                </p>
                            </div>
                        </div>
                        {isEditing && (
                            <button
                                onClick={resetForm}
                                className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all border border-transparent hover:border-slate-300"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <div className="p-8">
                        {exams.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-200 mx-auto mb-6 text-slate-400">
                                    <BookOpen size={40} />
                                </div>
                                <p className="text-slate-500 font-medium text-base">
                                    Chưa có môn thi. Hãy thêm ở trang <strong>Môn thi</strong>{" "}
                                    trước.
                                </p>
                            </div>
                        ) : (
                            <form
                                onSubmit={handleSubmit}
                                noValidate
                                style={{ display: "flex", flexDirection: "column", gap: 32 }}
                            >
                                {/* Subject select */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                                        Chọn môn học <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={subjectId}
                                        disabled={isEditing}
                                        onChange={(e) => {
                                            setSubjectId(e.target.value);
                                            onClearUpload?.();
                                            if (submitted)
                                                setErrors(
                                                    validateSyllabusForm({
                                                        subjectId: e.target.value,
                                                        chapters,
                                                    })
                                                );
                                        }}
                                        className={`w-full px-5 py-4 rounded-xl border text-base font-medium transition-all outline-none ${
                                            errors.subjectName
                                                ? "border-red-300 bg-red-50 focus:border-red-500"
                                                : "border-slate-300 bg-slate-50 focus:border-emerald-500 focus:bg-white"
                                        } ${isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                                    >
                                        <option value="">-- Chọn môn thi --</option>
                                        {availableExams.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.subjectName}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.subjectName && (
                                        <p className="mt-2 text-sm font-medium text-red-500 flex items-center gap-1.5">
                                            <AlertCircle size={15} />
                                            {errors.subjectName}
                                        </p>
                                    )}
                                </div>

                                {/* ── File import ── */}
                                <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                                            {uploading ? (
                                                <Loader2
                                                    size={20}
                                                    className="text-emerald-600 animate-spin"
                                                />
                                            ) : (
                                                <Upload size={20} className="text-emerald-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-emerald-800 text-base">
                                                Import từ file - AI phân cấp tự động
                                            </p>
                                            <p className="text-emerald-600 text-sm mt-1.5 font-medium leading-relaxed">
                                                Hỗ trợ&nbsp;
                                                <code className="bg-white border border-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-700">
                                                    .pdf
                                                </code>
                                                &nbsp;
                                                <code className="bg-white border border-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-700">
                                                    .docx
                                                </code>
                                                &nbsp;
                                                <code className="bg-white border border-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-700">
                                                    .txt
                                                </code>
                                                &nbsp;
                                                <code className="bg-white border border-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-700">
                                                    .json
                                                </code>
                                            </p>
                                            {uploadMsg && (
                                                <p
                                                    className={`text-sm mt-3 font-bold flex items-center gap-1.5 ${uploadMsg.type === "success" ? "text-emerald-600" : "text-red-600"}`}
                                                >
                                                    {uploadMsg.type === "success" ? (
                                                        <Check size={16} />
                                                    ) : (
                                                        <X size={16} />
                                                    )}{" "}
                                                    {uploadMsg.text}
                                                </p>
                                            )}
                                        </div>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept=".pdf,.docx,.doc,.txt,.json"
                                            className="hidden"
                                            onChange={handleFileSelected}
                                        />
                                        <button
                                            type="button"
                                            disabled={uploading}
                                            onClick={() => fileRef.current?.click()}
                                            className="shrink-0 px-5 py-2.5 font-bold text-sm rounded-lg text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-all disabled:opacity-60 border border-emerald-200"
                                        >
                                            {uploading ? "Đang đọc..." : "Chọn file"}
                                        </button>
                                    </div>
                                </div>

                                {/* ── Chapter & Sub-chapter list ── */}
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">
                                                Cấu trúc chương học{" "}
                                                <span className="text-red-500">*</span>
                                            </p>
                                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mt-1">
                                                {mainChaptersCount} chương lớn ·{" "}
                                                {
                                                    chapters.filter((c) => (c.level ?? 0) === 1)
                                                        .length
                                                }{" "}
                                                chương con ·{" "}
                                                {chapters.filter((c) => (c.level ?? 0) >= 2).length}{" "}
                                                mục nhỏ
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setChapters((cs) => [...cs, newChapter(0)])
                                            }
                                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-lg transition-all border border-slate-200"
                                        >
                                            <Plus size={16} /> Thêm chương
                                        </button>
                                    </div>

                                    {errors.chapters && (
                                        <p className="mb-3 text-sm font-medium text-red-500 flex items-center gap-1.5">
                                            <AlertCircle size={15} />
                                            {errors.chapters}
                                        </p>
                                    )}

                                    <div
                                        className="max-h-[600px] overflow-y-auto pr-2"
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 16,
                                        }}
                                    >
                                        {chapters.map((c, idx) => {
                                            const lv = c.level ?? 0;
                                            const color = getLevelColor(lv);
                                            const label = labels[idx];
                                            const hasError = !!errors.chapterNames?.[c.id];

                                            /* ── Chương lớn (level 0) ── */
                                            if (lv === 0) {
                                                return (
                                                    <div
                                                        key={c.id}
                                                        className={`rounded-xl border transition-all ${
                                                            hasError
                                                                ? "border-red-300 bg-red-50"
                                                                : "border-slate-200 bg-white hover:border-emerald-300"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-4 px-5 pt-5 pb-4">
                                                            <span
                                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm"
                                                                style={{
                                                                    background: color.gradient,
                                                                }}
                                                            >
                                                                {label}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={c.name}
                                                                onChange={(e) =>
                                                                    changeChapter(
                                                                        c.id,
                                                                        "name",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder={`Tên chương ${label}...`}
                                                                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-base font-medium focus:border-emerald-500 outline-none transition-all min-w-0"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => addSubChapter(c.id)}
                                                                title="Thêm chương con"
                                                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg shrink-0 transition-all border"
                                                                style={{
                                                                    background: color.bg,
                                                                    color: color.text,
                                                                    borderColor: color.border,
                                                                }}
                                                            >
                                                                <Plus size={14} /> Mục con
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    deleteChapterWithChildren(c.id)
                                                                }
                                                                disabled={
                                                                    mainChaptersCount === 1 &&
                                                                    chapters.length === 1
                                                                }
                                                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-all shrink-0 border border-transparent hover:border-red-100"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>

                                                        {hasError && (
                                                            <p className="px-5 pb-3 text-sm font-medium text-red-500 flex items-center gap-1.5">
                                                                <AlertCircle size={15} />
                                                                {errors.chapterNames![c.id]}
                                                            </p>
                                                        )}

                                                        <div className="grid grid-cols-2 gap-5 px-5 pb-5 ml-14">
                                                            {(
                                                                [
                                                                    "difficulty",
                                                                    "importance",
                                                                ] as const
                                                            ).map((field) => (
                                                                <div key={field}>
                                                                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                                                                        {field === "difficulty"
                                                                            ? "Độ khó"
                                                                            : "Tầm quan trọng"}
                                                                    </label>
                                                                    <select
                                                                        value={c[field]}
                                                                        onChange={(e) =>
                                                                            changeChapter(
                                                                                c.id,
                                                                                field,
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                                                    >
                                                                        {(
                                                                            Object.keys(
                                                                                DIFFICULTY_LABELS
                                                                            ) as DifficultyLevel[]
                                                                        ).map((d) => (
                                                                            <option
                                                                                key={d}
                                                                                value={d}
                                                                            >
                                                                                {
                                                                                    DIFFICULTY_LABELS[
                                                                                        d
                                                                                    ]
                                                                                }
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            /* ── Chương con / mục nhỏ (level 1, 2) ── */
                                            return (
                                                <div
                                                    key={c.id}
                                                    className="flex items-center gap-3 transition-all"
                                                    style={{
                                                        marginLeft: lv * 40, // Increased margin for deeper hierarchy
                                                    }}
                                                >
                                                    {/* Indicator line */}
                                                    <div className="w-4 h-px bg-slate-200 shrink-0" />

                                                    <div
                                                        className="flex-1 flex flex-wrap items-center gap-3 rounded-lg border"
                                                        style={{
                                                            background: hasError
                                                                ? "#fef2f2"
                                                                : color.bg,
                                                            borderColor: hasError
                                                                ? "#fca5a5"
                                                                : color.border,
                                                            padding: "10px 16px",
                                                        }}
                                                    >
                                                        {/* Level label */}
                                                        <span
                                                            className="text-sm font-bold shrink-0 min-w-[2.5rem] text-right"
                                                            style={{ color: color.text }}
                                                        >
                                                            {label}
                                                        </span>

                                                        <input
                                                            type="text"
                                                            value={c.name}
                                                            onChange={(e) =>
                                                                changeChapter(
                                                                    c.id,
                                                                    "name",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder={`Mục ${label}...`}
                                                            className="flex-1 px-4 py-2 rounded-lg border bg-white text-sm font-medium outline-none transition-all min-w-0"
                                                            style={{
                                                                borderColor: hasError
                                                                    ? "#fca5a5"
                                                                    : "#e2e8f0",
                                                            }}
                                                            onFocus={(e) =>
                                                                (e.currentTarget.style.borderColor =
                                                                    color.text)
                                                            }
                                                            onBlur={(e) =>
                                                                (e.currentTarget.style.borderColor =
                                                                    hasError
                                                                        ? "#fca5a5"
                                                                        : "#e2e8f0")
                                                            }
                                                        />

                                                        {/* Compact difficulty/importance with labels */}
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <label
                                                                htmlFor={`difficulty-${c.id}`}
                                                                className="text-xs font-bold text-slate-400 uppercase tracking-wide cursor-pointer hover:text-slate-600 transition-colors"
                                                            >
                                                                Độ khó
                                                            </label>
                                                            <select
                                                                id={`difficulty-${c.id}`}
                                                                value={c.difficulty}
                                                                onChange={(e) =>
                                                                    changeChapter(
                                                                        c.id,
                                                                        "difficulty",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold outline-none focus:border-emerald-500 transition-colors"
                                                            >
                                                                {(
                                                                    Object.keys(
                                                                        DIFFICULTY_SHORT
                                                                    ) as DifficultyLevel[]
                                                                ).map((d) => (
                                                                    <option key={d} value={d}>
                                                                        {DIFFICULTY_SHORT[d]}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <label
                                                                htmlFor={`importance-${c.id}`}
                                                                className="text-xs font-bold text-slate-400 uppercase tracking-wide cursor-pointer hover:text-slate-600 transition-colors"
                                                            >
                                                                Quan trọng
                                                            </label>
                                                            <select
                                                                id={`importance-${c.id}`}
                                                                value={c.importance}
                                                                onChange={(e) =>
                                                                    changeChapter(
                                                                        c.id,
                                                                        "importance",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold outline-none focus:border-emerald-500 transition-colors"
                                                            >
                                                                {(
                                                                    Object.keys(
                                                                        DIFFICULTY_SHORT
                                                                    ) as DifficultyLevel[]
                                                                ).map((d) => (
                                                                    <option key={d} value={d}>
                                                                        {DIFFICULTY_SHORT[d]}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {lv < 2 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => addSubChapter(c.id)}
                                                                title="Thêm mục con"
                                                                className="p-2 rounded-lg transition-all shrink-0 hover:bg-white"
                                                                style={{ color: color.text }}
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteChapterWithChildren(c.id)
                                                            }
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all shrink-0"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>

                                                        {c.difficultyReason && (
                                                            <div className="w-full -mt-1 text-[12px] text-slate-500 italic px-2">
                                                                <span className="font-semibold text-slate-400 mr-1">AI giải thích:</span>
                                                                {c.difficultyReason}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        className="flex-1 flex items-center justify-center gap-2 h-14 text-white font-bold rounded-xl shadow-sm hover:opacity-90 transition-all text-base"
                                        style={{ background: isEditing ? "#0ea5e9" : "#059669" }}
                                    >
                                        <Check size={20} />
                                        {isEditing ? "Cập nhật đề cương" : "Lưu đề cương"}
                                    </button>
                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="px-8 h-14 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all"
                                        >
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
            <div
                className="xl:col-span-2"
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
            >
                <div className="card rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                    <div className="px-8 py-6 flex items-center justify-between bg-slate-50 border-b border-slate-100">
                        <div>
                            <h2 className="font-bold text-slate-900 text-xl leading-none">
                                Đề cương đã lưu
                            </h2>
                            <p className="text-slate-500 font-medium text-sm mt-1.5">
                                {syllabuses.length === 0
                                    ? "Chưa có đề cương nào"
                                    : `${syllabuses.length} môn đã nhập`}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0 bg-white border border-slate-200 text-slate-700 shadow-sm">
                            {syllabuses.length}
                        </div>
                    </div>

                    <div className="p-8">
                        {syllabuses.length === 0 ? (
                            <div className="py-14 text-center flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400">
                                    <BookOpen size={28} />
                                </div>
                                <p className="text-slate-900 font-bold text-lg">
                                    Chưa có đề cương nào
                                </p>
                                <p className="text-slate-500 font-medium text-base">
                                    Điền form bên trái để thêm!
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {syllabuses.map((s) => {
                                    const exam = exams.find((e) => e.id === s.subjectId);
                                    const isOpen = expanded === s.id;
                                    const isCurrentEdit = editingId === s.id;
                                    const savedLabels = computeLabels(s.chapters);
                                    const mainCount = s.chapters.filter(
                                        (c) => (c.level ?? 0) === 0
                                    ).length;
                                    const subCount = s.chapters.filter(
                                        (c) => (c.level ?? 0) > 0
                                    ).length;
                                    return (
                                        <div
                                            key={s.id}
                                            className="rounded-2xl overflow-hidden transition-all bg-white"
                                            style={{
                                                border: isCurrentEdit
                                                    ? "2px solid #059669"
                                                    : "1px solid #e2e8f0",
                                            }}
                                        >
                                            <div
                                                className="flex items-center gap-4 px-6 py-5 cursor-pointer hover:bg-slate-50 transition-colors"
                                                onClick={() => setExpanded(isOpen ? null : s.id)}
                                            >
                                                <div
                                                    className="w-3 h-3 rounded-sm shrink-0"
                                                    style={{ background: exam?.color ?? "#10b981" }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-800 text-base truncate">
                                                        {s.subjectName}
                                                    </p>
                                                    <p className="text-sm font-medium text-slate-500 mt-1">
                                                        {mainCount} chương lớn
                                                        {subCount > 0 && (
                                                            <>
                                                                {" "}
                                                                ·{" "}
                                                                <span className="text-emerald-600 font-semibold">
                                                                    {subCount} mục con
                                                                </span>
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartEdit(s);
                                                        }}
                                                        className="p-2 rounded-lg transition-all text-slate-400 hover:text-emerald-600 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(s.id);
                                                        }}
                                                        className="p-2 rounded-lg transition-all text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <div className="p-1.5 text-slate-400">
                                                        {isOpen ? (
                                                            <ChevronUp size={20} />
                                                        ) : (
                                                            <ChevronDown size={20} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {isOpen && (
                                                <div className="border-t border-slate-100 px-6 py-5 bg-slate-50">
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            gap: 12,
                                                        }}
                                                    >
                                                        {s.chapters.map((c, i) => {
                                                            const lv = c.level ?? 0;
                                                            const color = getLevelColor(lv);
                                                            const lbl = savedLabels[i];
                                                            return (
                                                                <div
                                                                    key={c.id}
                                                                    className="flex items-center gap-3"
                                                                    style={{ marginLeft: lv * 32 }}
                                                                >
                                                                    {lv === 0 ? (
                                                                        <span
                                                                            className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                                                                            style={{
                                                                                background:
                                                                                    color.gradient,
                                                                            }}
                                                                        >
                                                                            {lbl}
                                                                        </span>
                                                                    ) : (
                                                                        <span
                                                                            className="text-xs font-bold shrink-0 w-8 text-right"
                                                                            style={{
                                                                                color: color.text,
                                                                            }}
                                                                        >
                                                                            {lbl}
                                                                        </span>
                                                                    )}
                                                                    <span
                                                                        className={`flex-1 min-w-0 truncate ${lv === 0 ? "text-slate-800 font-bold text-sm" : "text-slate-600 font-medium text-sm"}`}
                                                                    >
                                                                        {c.name}
                                                                    </span>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        <span className="text-xs font-bold text-slate-400 uppercase">
                                                                            Độ khó
                                                                        </span>
                                                                        <span
                                                                            className={`text-xs px-2 py-1 rounded border font-bold ${BADGE[c.difficulty]}`}
                                                                        >
                                                                            {
                                                                                DIFFICULTY_SHORT[
                                                                                    c.difficulty
                                                                                ]
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        <span className="text-xs font-bold text-slate-400 uppercase">
                                                                            Quan trọng
                                                                        </span>
                                                                        <span
                                                                            className={`text-xs px-2 py-1 rounded border font-bold ${BADGE[c.importance]}`}
                                                                        >
                                                                            {
                                                                                DIFFICULTY_SHORT[
                                                                                    c.importance
                                                                                ]
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="rounded-2xl p-6 text-sm bg-slate-50 border border-slate-200 shadow-sm">
                    <p className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 size={16} className="text-emerald-600" /> Phân cấp chương học
                    </p>
                    <div
                        style={{ display: "flex", flexDirection: "column", gap: 12 }}
                        className="text-sm text-slate-600"
                    >
                        {[
                            {
                                color: LEVEL_COLORS[0],
                                label: "Chương lớn",
                                example: "Chương 1: Cấu trúc dữ liệu",
                            },
                            {
                                color: LEVEL_COLORS[1],
                                label: "Chương con",
                                example: "1.1. Mảng và danh sách",
                            },
                            {
                                color: LEVEL_COLORS[2],
                                label: "Mục nhỏ",
                                example: "1.1.1. Mảng một chiều",
                            },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-4">
                                <span
                                    className="w-5 h-5 rounded shadow-sm shrink-0"
                                    style={{ background: item.color.gradient }}
                                />
                                <div>
                                    <span className="font-bold text-slate-800">{item.label}</span>
                                    <span className="text-slate-500 ml-2"> - {item.example}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
