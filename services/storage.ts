import { NovelNode, ProjectMeta } from "../types";

const PROJECTS_KEY = 'novelist_ai_projects';
const CONTENT_PREFIX = 'novelist_ai_content_';

// Get list of all projects
export const getProjects = (): ProjectMeta[] => {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error loading projects", e);
    return [];
  }
};

// Save a project (Meta + Content)
export const saveProject = (meta: ProjectMeta, nodes: NovelNode[]) => {
  try {
    // 1. Update Meta List
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === meta.id);
    if (index >= 0) {
      projects[index] = { ...meta, lastModified: Date.now() };
    } else {
      projects.unshift({ ...meta, lastModified: Date.now() });
    }
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));

    // 2. Save Content
    localStorage.setItem(CONTENT_PREFIX + meta.id, JSON.stringify(nodes));
  } catch (e) {
    console.error("Error saving project", e);
    alert("Không thể lưu dự án (Bộ nhớ đầy?)");
  }
};

// Load specific project content
export const loadProjectContent = (id: string): NovelNode[] | null => {
  try {
    const raw = localStorage.getItem(CONTENT_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Error loading content", e);
    return null;
  }
};

// Delete project
export const deleteProject = (id: string) => {
  try {
    const projects = getProjects().filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    localStorage.removeItem(CONTENT_PREFIX + id);
  } catch (e) {
    console.error("Error deleting project", e);
  }
};
