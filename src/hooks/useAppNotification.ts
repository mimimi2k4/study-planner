import { useEffect, useState } from "react";
import { getMilestones, saveMilestones, getExams } from "../utils/storage";

export function useAppNotification() {
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    // Hàm yêu cầu quyền gửi thông báo
    const requestNotificationPermission = async () => {
      if (!("Notification" in window)) {
        console.warn("Trình duyệt này không hỗ trợ desktop notification");
        return false;
      }
      if (Notification.permission === "granted") return true;
      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }
      return false;
    };

    const checkAndNotify = async () => {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        setPermissionDenied(true);
        return; // Fallback banner sẽ được hiển thị trên UI
      } else {
        setPermissionDenied(false);
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const todayStorageKey = `notified_${todayStr}`;
      
      // Chống spam: Nếu đã thông báo trong ngày hôm nay rồi thì bỏ qua
      if (localStorage.getItem(todayStorageKey)) return;

      let hasSentNotification = false;

      // 1. Xử lý Milestone
      const milestones = getMilestones();
      let isMilestoneUpdated = false;
      const updatedMilestones = milestones.map((m) => {
        if (m.deadlineDate === todayStr && m.status === "chưa đạt") {
          // Gửi thông báo
          new Notification("🎉 Chúc mừng!", {
            body: `Bạn đã đạt mốc tiến độ: ${m.name}`,
            icon: "/favicon.svg", 
          });
          isMilestoneUpdated = true;
          hasSentNotification = true;
          return { ...m, status: "đã đạt" as const };
        }
        return m;
      });

      if (isMilestoneUpdated) {
        saveMilestones(updatedMilestones);
      }

      // 2. Xử lý Lịch thi (Exams)
      const exams = getExams();
      const todayMs = new Date(todayStr).getTime();

      exams.forEach((exam) => {
        const examDateStr = exam.examDateTime.split("T")[0];
        const examMs = new Date(examDateStr).getTime();
        const diffDays = Math.ceil((examMs - todayMs) / (1000 * 60 * 60 * 24));

        if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
          new Notification("⏰ Nhắc nhở lịch thi!", {
            body: `Chỉ còn ${diffDays} ngày nữa là đến ngày thi môn ${exam.subjectName}. Hãy ôn tập thật tốt nhé!`,
            icon: "/favicon.svg",
          });
          hasSentNotification = true;
        }
      });

      // Đánh dấu đã kiểm tra và thông báo trong ngày
      if (hasSentNotification) {
        localStorage.setItem(todayStorageKey, "true");
      }
    };

    checkAndNotify();
  }, []);

  return { permissionDenied };
}