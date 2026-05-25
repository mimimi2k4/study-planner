import type { FreeSlot } from '../types'

export const START_HOUR = 6
export const END_HOUR   = 23
export const SLOTS      = (END_HOUR - START_HOUR) * 2

export function rowZone(row: number): 'morning' | 'afternoon' | 'evening' {
  const hour = START_HOUR + Math.floor(row / 2)
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export function slotToTime(slot: number): string {
  const m = START_HOUR * 60 + slot * 30
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function timeToSlot(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h - START_HOUR) * 2 + Math.floor(m / 30)
}

export function buildGrid(freeSlots: FreeSlot[]): boolean[][] {
  const g: boolean[][] = Array.from({ length: SLOTS }, () => new Array(7).fill(false))
  for (const s of freeSlots) {
    const from = timeToSlot(s.startTime), to = timeToSlot(s.endTime)
    for (let r = from; r < to; r++) if (r >= 0 && r < SLOTS) g[r][s.day] = true
  }
  return g
}

export function gridToSlots(grid: boolean[][]): FreeSlot[] {
  const slots: FreeSlot[] = []
  for (let day = 0; day < 7; day++) {
    let start: number | null = null
    for (let row = 0; row <= SLOTS; row++) {
      const sel = row < SLOTS && grid[row][day]
      if (sel && start === null) start = row
      else if (!sel && start !== null) {
        slots.push({ day, startTime: slotToTime(start), endTime: slotToTime(row) })
        start = null
      }
    }
  }
  return slots
}

export function totalHours(slots: FreeSlot[]): number {
  return slots.reduce((sum, x) => {
    const [sh, sm] = x.startTime.split(':').map(Number)
    const [eh, em] = x.endTime.split(':').map(Number)
    return sum + (eh * 60 + em - sh * 60 - sm) / 60
  }, 0)
}
