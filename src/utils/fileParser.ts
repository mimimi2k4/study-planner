import type { DifficultyLevel } from '../types'
import { nanoid } from './nanoid'

export interface ParsedChapter {
  id: string
  name: string
  difficulty: DifficultyLevel
  importance: DifficultyLevel
}

function linesToChapters(lines: string[]): ParsedChapter[] {
  return lines
    .map((l) => l.replace(/^[\d\.\-\*・･•]+\s*/u, '').trim())
    .filter((l) => l.length > 1)
    .map((l) => ({ id: nanoid(), name: l, difficulty: 'medium', importance: 'medium' }))
}

async function parsePDF(buffer: ArrayBuffer): Promise<ParsedChapter[]> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).href

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    fullText += content.items
      .filter((item): item is { str: string; transform: number[] } => 'str' in item)
      .map((item) => item.str)
      .join(' ') + '\n'
  }
  return linesToChapters(fullText.split(/\n|\r/))
}

async function parseDOCX(buffer: ArrayBuffer): Promise<ParsedChapter[]> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return linesToChapters(result.value.split(/\n|\r/))
}

function parseTXT(text: string): ParsedChapter[] {
  return linesToChapters(text.split(/\n|\r/))
}

function parseJSON(text: string): ParsedChapter[] {
  try {
    const data = JSON.parse(text)
    if (!Array.isArray(data)) return []
    return data.map((item) => {
      if (typeof item === 'string') return { id: nanoid(), name: item, difficulty: 'medium' as DifficultyLevel, importance: 'medium' as DifficultyLevel }
      return {
        id: nanoid(),
        name: item.name ?? item.title ?? String(item),
        difficulty: (item.difficulty ?? 'medium') as DifficultyLevel,
        importance: (item.importance ?? item.priority ?? 'medium') as DifficultyLevel,
      }
    })
  } catch {
    return []
  }
}

export async function parseFileToChapters(file: File): Promise<ParsedChapter[]> {
  const name = file.name.toLowerCase()
  const buffer = await file.arrayBuffer()

  if (name.endsWith('.pdf')) return parsePDF(buffer)
  if (name.endsWith('.docx') || name.endsWith('.doc')) return parseDOCX(buffer)

  const text = new TextDecoder('utf-8').decode(buffer)
  if (name.endsWith('.json')) return parseJSON(text)
  return parseTXT(text) // .txt and anything else
}
