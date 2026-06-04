import { useState, useEffect } from "react";
import type { Milestone } from "../types";
import { getMilestones, saveMilestones } from "../utils/storage";

export function useMilestones() {
    const [milestones, setMilestones] = useState<Milestone[]>(() => getMilestones());

    useEffect(() => {
        saveMilestones(milestones);
    }, [milestones]);

    const addMilestones = (newMilestones: Milestone[]) => {
        setMilestones((prev) => {
            const subjectId = newMilestones[0]?.subjectId;
            if (!subjectId) return prev;

            const others = prev.filter((m) => m.subjectId !== subjectId);
            return [...others, ...newMilestones];
        });
    };

    const clearMilestones = (subjectId: string) => {
        setMilestones((prev) => prev.filter((m) => m.subjectId !== subjectId));
    };

    return { milestones, addMilestones, clearMilestones, setMilestones };
}
