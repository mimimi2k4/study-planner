import type { FreeSlot } from "../../types";

export interface TimeSlotPickerProps {
    freeSlots: FreeSlot[];
    onSave: (slots: FreeSlot[]) => void;
}
