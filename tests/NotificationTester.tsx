import { useState } from "react";
import { Bell, RefreshCw } from "lucide-react";

export default function NotificationTester() {
  const [status, setStatus] = useState<string>("");

  // 1. Hàm test gửi thông báo tức thì
  const handleTestNotification = async () => {
    if (!("Notification" in window)) {
      setStatus("Trình duyệt không hỗ trợ");
      return;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("🔔 Thông báo thử nghiệm", {
        body: "Hệ thống Notification API đang hoạt động hoàn hảo!",
       // icon: "/favicon.svg", // Sẽ lấy icon của project bạn
      });
      setStatus("Đã gửi thành công!");
    } else {
      setStatus("❌ Bị từ chối quyền (Denied)");
    }
  };

  // 2. Hàm xóa biến khóa chống spam trong ngày
  const handleResetSpamLock = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const key = `notified_${todayStr}`;
    localStorage.removeItem(key);
    setStatus("Đã xóa khóa. Hãy F5 (Reload) lại trang!");
  };

  return (
    <div className="p-4 mb-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap gap-3 items-center">
      <span className="font-bold text-slate-700 text-sm mr-2">🛠️ Dev Tools:</span>
      
      <button
        onClick={handleTestNotification}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl text-sm font-semibold transition-colors"
      >
        <Bell size={16} /> Gửi Test Noti
      </button>

      <button
        onClick={handleResetSpamLock}
        className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
      >
        <RefreshCw size={16} /> Reset Khóa F5
      </button>

      {status && (
        <span className="text-sm font-medium text-emerald-600 animate-pulse ml-2">
          {status}
        </span>
      )}
    </div>
  );
}