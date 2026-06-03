import type { Chapter, Syllabus, ExamInfo } from "../../types";

export interface FormErrors {
    subjectName?: string;
    chapters?: string;
    chapterNames?: Record<string, string>;
}

export interface SyllabusFormState {
    subjectId: string;
    chapters: Chapter[];
}

export interface SyllabusFormProps {
    syllabuses: Syllabus[];
    exams: ExamInfo[];
    onAdd: (state: SyllabusFormState) => void;
    onUpdate: (id: string, state: SyllabusFormState) => void;
    onDelete: (id: string) => void;
    uploading: boolean;
    uploadMsg: { type: "success" | "error"; text: string } | null;
    importedChapters: Chapter[] | null;
    onFileUpload: (file: File) => void;
    onClearUpload?: () => void;
}

export function validateSyllabusForm(state: SyllabusFormState): FormErrors {
    const errs: FormErrors = {};
    if (!state.subjectId) errs.subjectName = "Vui lòng chọn môn học";
    if (state.chapters.length === 0) errs.chapters = "Cần ít nhất một chương";
    const chapterNames: Record<string, string> = {};
    state.chapters.forEach((c) => {
        if (!c.name.trim()) chapterNames[c.id] = "Tên chương không được để trống";
    });
    if (Object.keys(chapterNames).length > 0) errs.chapterNames = chapterNames;
    return errs;
}
