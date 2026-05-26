export const SUBJECT_COLORS = [
  '#4f46e5', // indigo
  '#0891b2', // cyan
  '#059669', // emerald
  '#d97706', // amber
  '#e11d48', // rose
  '#7c3aed', // violet
  '#0284c7', // sky
  '#16a34a', // green
  '#ea580c', // orange
  '#9333ea', // purple
]

export function getSubjectColor(index: number): string {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length]
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
