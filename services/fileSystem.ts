
import { NovelNode, ProjectMeta } from "../types";

/**
 * Thử kết nối thư mục local. 
 * Nếu chạy trong iframe (cross-origin), trình duyệt sẽ chặn và ném lỗi SecurityError.
 */
export const requestFolderPermission = async () => {
  try {
    if (!('showDirectoryPicker' in window)) {
      throw new Error("Trình duyệt không hỗ trợ File System Access API.");
    }
    const handle = await (window as any).showDirectoryPicker({
      mode: 'readwrite'
    });
    return handle;
  } catch (e: any) {
    console.warn("Folder Access Error:", e.name, e.message);
    if (e.name === 'SecurityError') {
      throw new Error("Bảo mật trình duyệt chặn quyền truy cập thư mục trực tiếp (Cross-origin frame). Vui lòng dùng tính năng 'Xuất/Nhập file dự án .JSON' để lưu trữ thủ công.");
    }
    return null;
  }
};

/**
 * Xuất toàn bộ dự án thành file JSON để lưu trữ vĩnh viễn trên máy tính
 */
export const exportProjectJSON = (project: ProjectMeta, nodes: NovelNode[]) => {
  const data = {
    meta: project,
    content: nodes,
    version: "1.0",
    exportDate: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Project_${project.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Đọc file JSON từ máy tính để khôi phục dự án
 */
export const importProjectJSON = (): Promise<{meta: ProjectMeta, content: NovelNode[]} | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return resolve(null);
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.meta && data.content) {
          resolve({ meta: data.meta, content: data.content });
        } else {
          alert("File JSON không đúng định dạng dự án.");
          resolve(null);
        }
      } catch (err) {
        console.error("Lỗi đọc file:", err);
        alert("Không thể đọc file JSON.");
        resolve(null);
      }
    };
    input.click();
  });
};

export const saveToLocalFolder = async (folderHandle: any, project: ProjectMeta, nodes: NovelNode[]) => {
  if (!folderHandle) return;
  try {
    const fileName = `${project.title.replace(/[/\\?%*:|"<>]/g, '-')}_${project.id}.json`;
    const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    const data = {
      meta: project,
      content: nodes,
      version: "1.0",
      exportDate: new Date().toISOString()
    };
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  } catch (e) {
    console.error("Lỗi khi đồng bộ local folder:", e);
  }
};
