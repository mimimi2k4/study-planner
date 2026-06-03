import { useEffect, useState } from "react";
import { getExams, getNotifiedToday, setNotifiedToday } from "../utils/storage";
import type { Milestone } from "../types";

// Khai báo kiểu dữ liệu cho thông báo trên màn hình
export interface InAppNotif {
    id: string;
    title: string;
    message: string;
    type: "success" | "warning";
}

export interface UseAppNotificationProps {
    milestones: Milestone[];
    setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
}

export function useAppNotification({ milestones, setMilestones }: UseAppNotificationProps) {
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [inAppNotifs, setInAppNotifs] = useState<InAppNotif[]>([]);

    // Hàm hiển thị thông báo nổi trên góc màn hình Web
    const showInAppNotif = (title: string, message: string, type: "success" | "warning") => {
        const newNotif = { id: Date.now().toString() + Math.random(), title, message, type };
        setInAppNotifs((prev) => [...prev, newNotif]);

        // Tự động ẩn thông báo sau 5 giây
        setTimeout(() => {
            setInAppNotifs((prev) => prev.filter((n) => n.id !== newNotif.id));
        }, 5000);
    };

    useEffect(() => {
        const requestNotificationPermission = async () => {
            if (!("Notification" in window)) return false;
            if (Notification.permission === "granted") return true;
            if (Notification.permission !== "denied") {
                const permission = await Notification.requestPermission();
                return permission === "granted";
            }
            return false;
        };

        const checkAndNotify = async () => {
            const hasPermission = await requestNotificationPermission();
            setPermissionDenied(!hasPermission);

            const todayStr = new Date().toISOString().split("T")[0];
            const todayStorageKey = `notified_${todayStr}`;

            if (getNotifiedToday(todayStorageKey)) return;

            let hasSentNotification = false;

            // 1. Xử lý Milestone
            let isMilestoneUpdated = false;
            const updatedMilestones = milestones.map((m) => {
                if (m.deadlineDate === todayStr && m.status === "chưa đạt") {
                    // Gửi System Notification (nếu được cấp quyền)
                    if (hasPermission) {
                        new Notification("🎉 Chúc mừng!", { body: `Bạn đã đạt mốc: ${m.name}` });
                    }
                    // LUÔN LUÔN GỬI In-App Notification trên giao diện
                    showInAppNotif("Chúc mừng đạt mốc! 🎉", `Hoàn thành: ${m.name}`, "success");

                    isMilestoneUpdated = true;
                    hasSentNotification = true;
                    return { ...m, status: "đã đạt" as const };
                }
                return m;
            });

            if (isMilestoneUpdated) {
                setMilestones(updatedMilestones);
            }

            // 2. Xử lý Lịch thi
            const exams = getExams();
            const todayMs = new Date(todayStr).getTime();

            exams.forEach((exam) => {
                const examDateStr = exam.examDateTime.split("T")[0];
                const examMs = new Date(examDateStr).getTime();
                const diffDays = Math.ceil((examMs - todayMs) / (1000 * 60 * 60 * 24));

                if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
                    const msg = `Chỉ còn ${diffDays} ngày nữa là thi môn ${exam.subjectName}!`;
                    if (hasPermission) {
                        new Notification("⏰ Nhắc nhở lịch thi", { body: msg });
                    }
                    showInAppNotif("Sắp thi rồi! ⏰", msg, "warning");
                    hasSentNotification = true;
                }
            });

            if (hasSentNotification) {
                setNotifiedToday(todayStorageKey);
            }
        };

        checkAndNotify();
    }, [milestones, setMilestones]);

    // Trả về thêm state của InAppNotifs và hàm để đóng thủ công
    return { permissionDenied, inAppNotifs, setInAppNotifs };
}
