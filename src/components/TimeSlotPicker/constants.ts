export const DAYS       = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
export const DAYS_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export const ZONE: Record<string, { bg: string; selBg: string; labelColor: string; name: string; legendBorder: string }> = {
  morning:   { bg: '#fffbeb', selBg: '#f59e0b', labelColor: '#92400e', name: 'Sáng',  legendBorder: '#fbbf24' },
  afternoon: { bg: '#eff6ff', selBg: '#2563eb', labelColor: '#1e3a8a', name: 'Chiều', legendBorder: '#60a5fa' },
  evening:   { bg: '#fff1f2', selBg: '#e11d48', labelColor: '#881337', name: 'Tối',   legendBorder: '#fda4af' },
}
