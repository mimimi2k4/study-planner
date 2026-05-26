import type { Chapter } from "../types";
import { nanoid } from "./nanoid";

function linesToChapters(lines: string[]): Chapter[] {
    return lines
        .map((l) => l.replace(/^[\d\.\-\*・･•]+\s*/u, "").trim())
        .filter((l) => l.length > 1)
        .map((l) => ({ id: nanoid(), name: l, difficulty: "medium", importance: "medium" }));
}

async function parsePDF(buffer: ArrayBuffer): Promise<Chapter[]> {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
    ).href;

    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText +=
            content.items
                .filter((item) => "str" in item)
                .map((item) => (item as { str: string }).str)
                .join(" ") + "\n";
    }
    return linesToChapters(fullText.split(/\n|\r/));
}

async function parseDOCX(buffer: ArrayBuffer): Promise<Chapter[]> {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return linesToChapters(result.value.split(/\n|\r/));
}

function parseTXT(text: string): Chapter[] {
    return linesToChapters(text.split(/\n|\r/));
}

const DIFFICULTY_MAP: Record<string, string> = {
  low: 'low', medium: 'medium', high: 'high',
  easy: 'low', normal: 'medium', hard: 'high',
  thấp: 'low', 'trung bình': 'medium', cao: 'high',
}

function normalizeDifficulty(val: unknown): 'low' | 'medium' | 'high' {
  const s = String(val ?? '').toLowerCase().trim()
  return (DIFFICULTY_MAP[s] ?? 'medium') as 'low' | 'medium' | 'high'
}

function parseJSON(text: string): Chapter[] {
  try {
    const data = JSON.parse(text)
    if (!Array.isArray(data)) return []
    return data.map((item) => {
      if (typeof item === 'string') return { id: nanoid(), name: item, difficulty: 'medium', importance: 'medium' }
      return {
        id: nanoid(),
        name: item.name ?? item.title ?? String(item),
        difficulty: normalizeDifficulty(item.difficulty),
        importance: normalizeDifficulty(item.importance ?? item.priority),
      }
    })
  } catch {
    return []
  }
}

export async function parseFileToChapters(file: File): Promise<Chapter[]> {
    const name = file.name.toLowerCase();
    const buffer = await file.arrayBuffer();

    if (name.endsWith(".pdf")) return parsePDF(buffer);
    if (name.endsWith(".docx") || name.endsWith(".doc")) return parseDOCX(buffer);

    const text = new TextDecoder("utf-8").decode(buffer);
    if (name.endsWith(".json")) return parseJSON(text);
    return parseTXT(text); // .txt and anything else
}
