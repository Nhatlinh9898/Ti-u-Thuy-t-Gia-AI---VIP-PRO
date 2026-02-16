
# 🚀 HƯỚNG DẪN TRIỂN KHAI THỰC TẾ: TIỂU THUYẾT GIA AI - VIP PRO

Ứng dụng này được xây dựng trên nền tảng React + Gemini AI SDK, hỗ trợ PWA và Hybrid Storage.

## 📋 Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên.
- **Gemini API Key**: Lấy tại [Google AI Studio](https://aistudio.google.com/).
- **Hosting**: Khuyến khích dùng Vercel hoặc Netlify (Hỗ trợ tốt cho SPA và PWA).

## 🛠️ Bước 1: Thiết lập môi trường Local
1. Tải toàn bộ mã nguồn về máy.
2. Cài đặt thư viện:
   ```bash
   npm install
   ```
3. Tạo file `.env` tại thư mục gốc:
   ```env
   API_KEY=your_gemini_api_key_here
   ```
4. Chạy thử nghiệm:
   ```bash
   npm run dev
   ```

## 🌐 Bước 2: Triển khai Frontend (Vercel - Khuyên dùng)
1. Đưa code lên một Repository trên **GitHub**.
2. Truy cập [Vercel](https://vercel.com/), chọn **Add New Project**.
3. Import Repository của bạn.
4. **Quan trọng**: Trong phần **Environment Variables**, thêm:
   - Key: `API_KEY`
   - Value: (Dán API Key Gemini của bạn vào)
5. Nhấn **Deploy**. Vercel sẽ cung cấp cho bạn một URL dạng `https://ten-app.vercel.app`.

## 💾 Bước 3: Triển khai Backend (Tùy chọn)
Nếu bạn muốn lưu trữ dữ liệu tập trung (không chỉ ở máy người dùng):
1. Chỉnh sửa `config.ts`:
   ```typescript
   BACKEND: {
     ENABLED: true,
     BASE_URL: 'https://api.cua-ban.com/api'
   }
   ```
2. Xây dựng Backend bằng Node.js/Express hoặc dùng các dịch vụ như **Supabase** (PostgreSQL) hoặc **Firebase** để làm DB lưu trữ JSON.

## 📱 Bước 4: Cài đặt PWA (Mobile & Desktop)
- **Trên iPhone (Safari)**: Mở link app -> Nhấn biểu tượng **Share** -> Chọn **Add to Home Screen**.
- **Trên Android (Chrome)**: Mở link app -> Nhấn **Dấu 3 chấm** -> Chọn **Install App**.

## 🛡️ Bảo mật & Chi phí
- **Giới hạn API**: Để tránh bị lộ API Key ở Client-side, trong thực tế bạn nên gọi API thông qua một **Proxy Backend**.
- **CORS**: Đảm bảo Backend của bạn cho phép domain của Frontend truy cập.

---
*Phát triển bởi SIÊU TRÍ TUỆ GIA - 2025*
