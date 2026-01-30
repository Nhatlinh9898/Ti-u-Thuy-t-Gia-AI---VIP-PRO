export type NodeType = 'NOVEL' | 'PART' | 'CHAPTER' | 'ACT' | 'SCENE';

export interface NovelNode {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  summary?: string;
  overview?: string; // New: Tóm tắt tổng quan for Core Story Lock
  children: NovelNode[];
  isExpanded?: boolean;
}

export interface ProjectMeta {
  id: string;
  title: string;
  lastModified: number;
  overview: string;
}

export interface GenerationRequest {
  nodeId: string;
  nodeType: NodeType;
  currentContent: string;
  contextPath: string;
  promptType: 'WRITE' | 'SUMMARIZE' | 'TITLE' | 'STRUCTURE' | 'END_TRANSITION' | 'INTRO_STYLE' | 'NEW_PROJECT' | 'CONTINUITY_CHECK' | 'CONNECT_NODES';
  extraInstruction?: string;
  style?: string;
  nextNodeTitle?: string; 
  previousContext?: string;
  projectOverview?: string; // New: Pass strict context
}

export interface EndTransitionResponse {
  KetThuc: string;
  ChuyenCanh: string;
  GoiYNoiDungTiepTheo: string;
  HuongToiNodeTiepTheo: string;
}

export interface ContinuityResponse {
  TinhOnDinhNhanVat: string;
  TinhLienMachSuKien: string;
  LoiKhuyenDieuChinh: string;
}

export interface NewProjectResponse {
  title: string;
  summary: string;
  overview: string; // New: Detailed overview
  structure: {
    title: string;
    summary: string;
    type: NodeType;
  }[];
}
