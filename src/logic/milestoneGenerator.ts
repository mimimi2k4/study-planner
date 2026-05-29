import type { Milestone, MilestoneResult } from "../types";
import { nanoid } from "../utils/nanoid";

export function generateMilestones(
    examId: string,
    examDateStr: string
): MilestoneResult {
    if (!examDateStr) {
        return { success: false, error: "Chưa nhập ngày thi (examDate bị trống)." };
    }

    const examDate = new Date(examDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timeDiff = examDate.getTime() - today.getTime();
    if (timeDiff <= 0) {
        return { success: false, error: "Ngày thi đã qua hoặc là ngày hôm nay. Không thể tạo cột mốc tương lai." };
    }

    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const milestones: Milestone[] = [];

    const formatDate = (d: Date): string => {
        return d.toISOString().split("T")[0];
    };

    if (daysLeft < 7) {
        const step = Math.floor(daysLeft / 3);
        
        // Mốc 1: 1/3
        const date1 = new Date(today);
        date1.setDate(today.getDate() + (step > 0 ? step : 1));
        milestones.push({
            milestoneId: nanoid(),
            subjectId: examId,
            name: "Hoàn thành 1/3 khối lượng",
            deadlineDate: formatDate(date1),
            status: "chưa đạt"
        });

        // Mốc 2: 2/3
        const date2 = new Date(today);
        date2.setDate(today.getDate() + (step * 2 > 0 ? step * 2 : 2));
        if (date2 < examDate) {
            milestones.push({
                milestoneId: nanoid(),
                subjectId: examId,
                name: "Hoàn thành 2/3 khối lượng",
                deadlineDate: formatDate(date2),
                status: "chưa đạt"
            });
        }

        // Mốc 3: Cuối
        const date3 = new Date(examDate);
        date3.setDate(examDate.getDate() - 1);
        if (date3 <= today) date3.setDate(examDate.getDate());
        milestones.push({
            milestoneId: nanoid(),
            subjectId: examId,
            name: "Tổng ôn trước ngày thi",
            deadlineDate: formatDate(date3),
            status: "chưa đạt"
        });
    } else if (daysLeft >= 8 && daysLeft <= 30) {
        let currentDate = new Date(today);
        let count = 1;
        while (true) {
            currentDate.setDate(currentDate.getDate() + 7);
            if (currentDate >= examDate) break;
            milestones.push({
                milestoneId: nanoid(),
                subjectId: examId,
                name: `Cột mốc tuần ${count}`,
                deadlineDate: formatDate(new Date(currentDate)),
                status: "chưa đạt"
            });
            count++;
        }
        
        const finalDate = new Date(examDate);
        finalDate.setDate(examDate.getDate() - 1);
        milestones.push({
            milestoneId: nanoid(),
            subjectId: examId,
            name: "Tổng ôn nước rút",
            deadlineDate: formatDate(finalDate),
            status: "chưa đạt"
        });
    } else {
        let currentDate = new Date(today);
        let count = 1;
        while (true) {
            currentDate.setDate(currentDate.getDate() + 14);
            if (currentDate >= examDate) break;
            milestones.push({
                milestoneId: nanoid(),
                subjectId: examId,
                name: `Cột mốc 2 tuần lần ${count}`,
                deadlineDate: formatDate(new Date(currentDate)),
                status: "chưa đạt"
            });
            count++;
        }
        
        const finalDate = new Date(examDate);
        finalDate.setDate(examDate.getDate() - 7);
        milestones.push({
            milestoneId: nanoid(),
            subjectId: examId,
            name: "Bắt đầu giai đoạn thi thử",
            deadlineDate: formatDate(finalDate),
            status: "chưa đạt"
        });
    }

    // Đảm bảo không bị duplicate ngày hoặc ngày lộn xộn
    const uniqueMilestones = Array.from(new Map(milestones.map(m => [m.deadlineDate, m])).values());
    uniqueMilestones.sort((a, b) => a.deadlineDate.localeCompare(b.deadlineDate));

    return { success: true, milestones: uniqueMilestones };
}
