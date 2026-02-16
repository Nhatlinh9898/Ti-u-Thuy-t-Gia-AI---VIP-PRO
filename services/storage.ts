
import { NovelNode, ProjectMeta } from "../types";
import { APP_CONFIG } from "../config";

const PROJECTS_KEY = APP_CONFIG.STORAGE.PROJECTS_KEY;
const CONTENT_PREFIX = APP_CONFIG.STORAGE.CONTENT_PREFIX;

// Helper gọi API
const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
  if (!APP_CONFIG.BACKEND.ENABLED) return null;
  try {
    const res = await fetch(`${APP_CONFIG.BACKEND.BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error('Backend Error');
    return await res.json();
  } catch (e) {
    console.error("Backend failed, falling back to local storage", e);
    return null;
  }
};

// Get list of all projects (Async)
export const getProjects = async (): Promise<ProjectMeta[]> => {
  // 1. Thử lấy từ Backend
  const cloudData = await apiCall('/projects');
  if (cloudData) return cloudData;

  // 2. Fallback về Local
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

// Save a project (Meta + Content)
export const saveProject = async (meta: ProjectMeta, nodes: NovelNode[]) => {
  // 1. Đồng bộ lên Backend
  await apiCall('/projects', 'POST', { meta, nodes });

  // 2. Lưu local (luôn lưu để dùng offline)
  try {
    const projects = await getProjects();
    const index = projects.findIndex(p => p.id === meta.id);
    const updatedMeta = { ...meta, lastModified: Date.now() };
    
    if (index >= 0) {
      projects[index] = updatedMeta;
    } else {
      projects.unshift(updatedMeta);
    }
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    localStorage.setItem(CONTENT_PREFIX + meta.id, JSON.stringify(nodes));
  } catch (e) {
    console.error("Error saving project locally", e);
  }
};

// Load specific project content
export const loadProjectContent = async (id: string): Promise<NovelNode[] | null> => {
  // 1. Thử từ Backend
  const cloudContent = await apiCall(`/projects/${id}`);
  if (cloudContent) return cloudContent;

  // 2. Fallback Local
  try {
    const raw = localStorage.getItem(CONTENT_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

// Delete project
export const deleteProject = async (id: string) => {
  await apiCall(`/projects/${id}`, 'DELETE');
  try {
    const projects = (await getProjects()).filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    localStorage.removeItem(CONTENT_PREFIX + id);
  } catch (e) {
    console.error("Error deleting project", e);
  }
};
