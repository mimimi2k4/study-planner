# Study Planner — Hệ Thống Tự Động Lập Kế Hoạch Ôn Thi

[![React](https://img.shields.io/badge/React-19.2-blue?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.5_Flash-orange?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini)

**Study Planner** là một ứng dụng web hiện đại giúp học sinh, sinh viên tự động xây dựng lộ trình và thời khóa biểu ôn thi cá nhân hóa. Ứng dụng tích hợp mô hình ngôn ngữ lớn **Gemini 2.5 Flash** để tự động bóc tách đề cương học thuật từ file tài liệu và sắp xếp lịch học khoa học bằng thuật toán tối ưu hóa thời gian rảnh.

---

## Tính Năng

### 1. Trích xuất Đề Cương

- Hỗ trợ tải lên các định dạng tài liệu phổ biến như `.pdf`, `.docx`, `.json`, `.txt`.
- Sử dụng mô hình **Gemini 2.5 Flash** thông qua thư viện `@google/generative-ai` để phân tích ngữ cảnh học thuật và tự động trích xuất cấu trúc mục lục có phân cấp rõ ràng.
- AI tự động đánh giá độ khó (`difficulty`) và tầm quan trọng (`importance`) của từng chương để làm căn cứ lập kế hoạch học tập.

### 2. Thuật Toán Sắp Xếp Lịch

- Tự động sắp xếp các phiên học tập dựa trên nguyên lý **Earliest Deadline First (EDF)** kết hợp với ma trận độ ưu tiên.
- Phân bổ các nhiệm vụ vào khung giờ rảnh hàng tuần của người dùng.
- Hỗ trợ các cơ chế tối ưu hóa:
    - Tự động chia nhỏ các chương lớn/khó thành các phiên học.
    - Thêm khoảng đệm chuẩn bị ôn tập (15 phút) và thời gian nghỉ giữa các phiên (5 phút).
    - Tự động phát hiện và đưa ra cảnh báo quá tải (`insufficient_time`), thiếu giờ rảnh (`no_slots`), hoặc ngày thi đã qua.

### 3. Quản Lý Cột Mốc Tiến Độ

- Tự động tạo ra các mốc ôn tập quan trọng (theo tuần, 2 tuần hoặc chặng nước rút trước thi) tùy thuộc vào số lượng ngày còn lại cho đến kỳ thi.
- Cập nhật trực quan tiến độ hoàn thành dưới dạng Timeline.

---

## Công Nghệ Sử Dụng

- **Frontend Core**: React 19.2, React Router 7.15, TypeScript 6.0
- **Build Tool**: Vite 8.0 với React Compiler được kích hoạt
- **Styling**: Tailwind CSS v4.0 (sử dụng `@tailwindcss/vite` plugin), Lucide React Icons
- **AI Integration**: `@google/generative-ai` (Gemini 2.5 Flash)
- **Document Parsers**: `pdfjs-dist` (cho PDF), `mammoth` (cho DOCX)
- **Local Database**: Đồng bộ hóa dữ liệu trạng thái tự động qua `localStorage`

---

## Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu cầu hệ thống

- Cần cài đặt sẵn [Node.js](https://nodejs.org) (phiên bản 18+ được khuyến nghị).

### Các bước thực hiện

1. **Tải mã nguồn và di chuyển vào thư mục dự án**:

    ```bash
    git clone https://github.com/mimimi2k4/study-planner
    cd study-planner
    ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**:

    ```bash
    npm install
    ```

3. **Cấu hình biến môi trường**:
   Tạo file `.env` ở thư mục gốc của dự án (ngang hàng với `package.json`) và thêm API Key của Google Gemini:

    ```env
    VITE_AI_API_KEY=your_gemini_api_key_here
    ```

    _(Bạn có thể lấy Gemini API Key miễn phí tại [Google AI Studio](https://aistudio.google.com/))_

4. **Khởi động máy chủ phát triển (Development Server)**:

    ```bash
    npm run dev
    ```

    Ứng dụng sẽ chạy tại địa chỉ mặc định `http://localhost:5173`. Mở trình duyệt và trải nghiệm!

5. **Biên dịch dự án cho production**:
    ```bash
    npm run build
    ```
    Các file tĩnh sau khi build sẽ được tạo trong thư mục [dist/](file:///d:/Code/study-planner/dist).
