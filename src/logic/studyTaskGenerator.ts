import type { Syllabus, ExamInfo, StudyTask, DifficultyLevel } from "../types";
import { nanoid } from "../utils/nanoid";

const MINUTES_BY_DIFFICULTY: Record<DifficultyLevel, number> = {
    low: 40,
    medium: 70,
    high: 110,
};

const PRIORITY_MATRIX: Record<string, DifficultyLevel> = {
    "high-high": "high",
    "high-medium": "high",
    "high-low": "medium",
    "medium-high": "high",
    "medium-medium": "medium",
    "medium-low": "low",
    "low-high": "medium",
    "low-medium": "low",
    "low-low": "low",
};

export function generateStudyTasks(syllabuses: Syllabus[], exams: ExamInfo[]): StudyTask[] {
    const colorMap = new Map<string, string>();
    for (const exam of exams) {
        colorMap.set(exam.id, exam.color);
    }

    const tasks: StudyTask[] = [];

    for (const syllabus of syllabuses) {
        for (const chapter of syllabus.chapters) {
            const key = `${chapter.difficulty}-${chapter.importance}`;
            const priority: DifficultyLevel = PRIORITY_MATRIX[key] ?? "medium";
            const estimatedMinutes = MINUTES_BY_DIFFICULTY[chapter.difficulty] ?? 60;
            const color = colorMap.get(syllabus.subjectId) ?? "#4f46e5";

            tasks.push({
                id: nanoid(),
                name: `Ôn tập: ${chapter.name}`,
                chapter: chapter.name,
                subjectId: syllabus.subjectId,
                subjectName: syllabus.subjectName,
                estimatedMinutes,
                priority,
                status: "pending",
                color,
            });
        }
    }

    const order: Record<DifficultyLevel, number> = { high: 0, medium: 1, low: 2 };
    return tasks.sort((a, b) => order[a.priority] - order[b.priority]);
}
