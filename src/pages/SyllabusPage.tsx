import { useState } from "react";
import type { Syllabus, ExamInfo, Chapter } from "../types";
import SyllabusForm from "../components/SyllabusForm/SyllabusForm";
import type { SyllabusFormState } from "../components/SyllabusForm/types";
import PageHeader from "../components/PageHeader";
import { FileText } from "lucide-react";
import { parseFileToChapters } from "../utils/fileParser";
import { nanoid } from "../utils/nanoid";

export interface SyllabusPageProps {
    syllabuses: Syllabus[];
    exams: ExamInfo[];
    onAdd: (s: Syllabus) => void;
    onUpdate: (s: Syllabus) => void;
    onDelete: (id: string) => void;
}

export default function SyllabusPage({
    syllabuses,
    exams,
    onAdd,
    onUpdate,
    onDelete,
}: SyllabusPageProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(
        null
    );
    const [importedChapters, setImportedChapters] = useState<Chapter[] | null>(null);

    function handleAdd(state: SyllabusFormState) {
        const exam = exams.find((e) => e.id === state.subjectId)!;
        onAdd({
            id: nanoid(),
            subjectId: state.subjectId,
            subjectName: exam.subjectName,
            chapters: state.chapters,
        });
    }

    function handleUpdate(id: string, state: SyllabusFormState) {
        const exam = exams.find((e) => e.id === state.subjectId)!;
        onUpdate({
            id,
            subjectId: state.subjectId,
            subjectName: exam.subjectName,
            chapters: state.chapters,
        });
    }

    async function handleFileUpload(file: File) {
        setUploading(true);
        setUploadMsg(null);
        try {
            const parsed = await parseFileToChapters(file);
            if (parsed.length === 0) {
                setUploadMsg({
                    type: "error",
                    text: `Không đọc được chương nào từ file "${file.name}". Hãy kiểm tra định dạng.`,
                });
            } else {
                setImportedChapters(parsed);
                setUploadMsg({
                    type: "success",
                    text: `Đã import ${parsed.length} chương từ "${file.name}"`,
                });
            }
        } catch (err) {
            setUploadMsg({ type: "error", text: `Lỗi đọc file: ${(err as Error).message}` });
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="space-y-8">
            <PageHeader
                icon={FileText}
                title="Đề cương môn học"
                subtitle="Nhập chương học, độ khó — hỗ trợ import file PDF/Word"
            />
            <SyllabusForm
                syllabuses={syllabuses}
                exams={exams}
                onAdd={handleAdd}
                onUpdate={handleUpdate}
                onDelete={onDelete}
                uploading={uploading}
                uploadMsg={uploadMsg}
                importedChapters={importedChapters}
                onFileUpload={handleFileUpload}
            />
        </div>
    );
}
