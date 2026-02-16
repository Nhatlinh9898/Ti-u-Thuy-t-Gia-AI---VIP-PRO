
# 🛠️ HƯỚNG DẪN XÂY DỰNG BACKEND CHO NOVELIST AI

Tài liệu này hướng dẫn bạn tạo một Server Node.js đơn giản để lưu trữ dự án của người dùng lên Cloud thay vì chỉ lưu ở LocalStorage.

## 1. Khởi tạo dự án Backend
Tạo một thư mục mới độc lập với Frontend:
```bash
mkdir novelist-backend
cd novelist-backend
npm init -y
npm install express mongoose cors dotenv
```

## 2. Mã nguồn Server mẫu (server.js)
Tạo file `server.js` và dán nội dung sau:

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Tăng limit vì nội dung tiểu thuyết có thể rất lớn

// Kết nối MongoDB (Thay URL bằng link MongoDB Atlas của bạn)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/novelist_ai');

// Định nghĩa Schema cho Dự án
const ProjectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ID từ frontend
  meta: {
    id: String,
    title: String,
    overview: String,
    lastModified: Number
  },
  nodes: Array // Lưu toàn bộ cấu trúc cây JSON
});

const Project = mongoose.model('Project', ProjectSchema);

// --- API ENDPOINTS ---

// 1. Lấy danh sách metadata
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find({}, 'meta'); // Chỉ lấy phần meta
    res.json(projects.map(p => p.meta));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Lưu hoặc Cập nhật dự án
app.post('/api/projects', async (req, res) => {
  const { meta, nodes } = req.body;
  try {
    const project = await Project.findOneAndUpdate(
      { id: meta.id },
      { meta, nodes, id: meta.id },
      { upsert: true, new: true }
    );
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Lấy nội dung chi tiết nodes
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.params.id });
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project.nodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Xóa dự án
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await Project.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
```

## 3. Cấu hình Frontend để kết nối
Mở file `config.ts` trong mã nguồn Frontend và cập nhật:

```typescript
export const APP_CONFIG = {
  BACKEND: {
    ENABLED: true, // BẬT CHẾ ĐỘ CLOUD
    BASE_URL: 'http://localhost:5000/api', // URL server của bạn
    TIMEOUT: 5000,
  },
  // ... các config khác
};
```

## 4. Triển khai (Deployment)
- **Database**: Sử dụng [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Miễn phí 512MB - đủ cho hàng ngàn tiểu thuyết).
- **Server**: Triển khai lên **Render**, **Railway** hoặc **Heroku**.
- **Biến môi trường**: Đừng quên thêm `MONGODB_URI` vào phần cấu hình của nhà cung cấp Hosting.

## 5. Lưu ý về Bảo mật
Để tránh người lạ phá hoại database:
1. Thêm **Middleware Auth** (như JWT) nếu bạn làm hệ thống có đăng nhập.
2. Giới hạn **CORS Origin** chỉ cho phép domain frontend của bạn.
