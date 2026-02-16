
export type NodeType = 'NOVEL' | 'PART' | 'CHAPTER' | 'ACT' | 'SCENE' | 'SECTION';

export interface NovelNode {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  summary?: string;
  overview?: string;
  children: NovelNode[];
  isExpanded?: boolean;
}

export interface ProjectMeta {
  id: string;
  title: string;
  lastModified: number;
  overview: string;
}

export interface NewProjectResponse {
  title: string;
  summary: string;
  overview: string;
  structure: {
    title: string;
    summary: string;
    type: NodeType;
  }[];
}
