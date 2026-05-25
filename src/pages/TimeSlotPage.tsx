import type { FreeSlot } from '../types'
import TimeSlotPicker from '../components/TimeSlotPicker/TimeSlotPicker'
import PageHeader from '../components/PageHeader'

export interface TimeSlotPageProps { freeSlots: FreeSlot[]; onSave: (slots: FreeSlot[]) => void }

export default function TimeSlotPage({ freeSlots, onSave }: TimeSlotPageProps) {
  return (
    <div className="space-y-8">
      <PageHeader emoji="⏰" title="Thời gian rảnh" subtitle="Click hoặc kéo để chọn khung giờ học trong tuần (mỗi ô = 30 phút)" />
      <TimeSlotPicker freeSlots={freeSlots} onSave={onSave} />
    </div>
  )
}
