import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { TreeEditor } from './components/TreeEditor';
import { NovelNode, NodeType, ProjectMeta } from './types';
import { generateNovelContent } from './services/aiService';
import { saveProject, loadProjectContent, getProjects, deleteProject } from './services/storage';
import { exportToTXT, exportToDOC, exportToMP4 } from './services/export';
import { 
  Wand2, Save, FileText, 
  Settings, Type, GitBranch, 
  Volume2, StopCircle, Book,
  PlusCircle, Activity, Lock,
  MoveRight, CheckCircle2, PenLine,
  Library, Trash2, Download, ExternalLink,
  Film
} from 'lucide-react';

// Initial Data for fresh start
const initialData: NovelNode[] = [
  {
    id: 'root',
    type: 'NOVEL',
    title: 'Tiểu Thuyết Mới',
    content: '',
    overview: 'Chưa có thông tin tổng quan.',
    children: [
      {
        id: 'p1',
        type: 'PART',
        title: 'Phần 1: Khởi đầu',
        content: '',
        children: [
          {
            id: 'c1',
            type: 'CHAPTER',
            title: 'Chương 1: Bóng tối',
            content: '',
            children: [],
            isExpanded: false
          }
        ],
        isExpanded: true
      }
    ],
    isExpanded: true
  }
];

// --- LOGIC: FLATTEN NODES FOR PERFECT TRAVERSAL ---
// This ensures Part -> Chapter -> Scene -> Next Chapter transitions work seamlessly regardless of nesting.
const flattenNodes = (nodes: NovelNode[]): NovelNode[] => {
  let flat: NovelNode[] = [];
  nodes.forEach(node => {
    flat.push(node);
    if (node.children && node.children.length > 0) {
      flat = flat.concat(flattenNodes(node.children));
    }
  });
  return flat;
};

// Find the strictly next logical node in the book structure
const findNextLogicalNode = (nodes: NovelNode[], currentId: string): NovelNode | null => {
  const flat = flattenNodes(nodes);
  const idx = flat.findIndex(n => n.id === currentId);
  if (idx !== -1 && idx < flat.length - 1) {
    return flat[idx + 1];
  }
  return null;
};

// Helper to find node by ID (Recursive for tree operations)
const findNode = (nodes: NovelNode[], id: string): NovelNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Helper to update node content
const updateNodeContent = (nodes: NovelNode[], id: string, newContent: Partial<NovelNode>): NovelNode[] => {
  return nodes.map(node => {
    if (node.id === id) {
      return { ...node, ...newContent };
    }
    if (node.children) {
      return { ...node, children: updateNodeContent(node.children, id, newContent) };
    }
    return node;
  });
};

// Helper to update two nodes at once (for bridge connection)
const updateLinkedNodes = (
  nodes: NovelNode[], 
  id1: string, content1: string, 
  id2: string, content2: string
): NovelNode[] => {
  return nodes.map(node => {
    if (node.id === id1) return { ...node, content: content1 };
    if (node.id === id2) return { ...node, content: content2 };
    
    if (node.children) {
      return { 
        ...node, 
        children: updateLinkedNodes(node.children, id1, content1, id2, content2) 
      };
    }
    return node;
  });
};

// Helper to add children
const addChildrenToNode = (nodes: NovelNode[], id: string, newChildren: NovelNode[]): NovelNode[] => {
  return nodes.map(node => {
    if (node.id === id) {
      return { ...node, children: [...node.children, ...newChildren], isExpanded: true };
    }
    if (node.children) {
      return { ...node, children: addChildrenToNode(node.children, id, newChildren) };
    }
    return node;
  });
};

function App() {
  // View State
  const [view, setView] = useState<'LIBRARY' | 'EDITOR'>('LIBRARY');
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectMeta | null>(null);

  // Editor State
  const [treeData, setTreeData] = useState<NovelNode[]>(initialData);
  const [selectedId, setSelectedId] = useState<string>('root');
  const [activeTab, setActiveTab] = useState<'WRITE' | 'STRUCTURE' | 'TOOLS' | 'EXPORT'>('WRITE');
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptTopic, setPromptTopic] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceRate, setVoiceRate] = useState(1.0);
  
  // UI States
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectIdea, setNewProjectIdea] = useState('');
  const [continuityReport, setContinuityReport] = useState<any>(null);

  // Derived
  const selectedNode = findNode(treeData, selectedId);
  const nextNodeObject = selectedNode ? findNextLogicalNode(treeData, selectedId) : null;
  const projectOverview = currentProject?.overview || '';

  // --- Persistence & Lifecycle ---
  useEffect(() => {
    // Load projects on mount
    setProjects(getProjects());
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (view === 'EDITOR' && currentProject && treeData) {
      const timer = setTimeout(() => {
        saveProject(currentProject, treeData);
      }, 1000); // Debounce save 1s
      return () => clearTimeout(timer);
    }
  }, [treeData, currentProject, view]);

  // --- Library Actions ---
  const handleOpenProject = (p: ProjectMeta) => {
    const content = loadProjectContent(p.id);
    if (content) {
      setTreeData(content);
      setCurrentProject(p);
      setView('EDITOR');
      // Set selected to root usually
      if (content.length > 0) setSelectedId(content[0].id);
    } else {
      alert("Không thể tải nội dung dự án này.");
    }
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa dự án này?")) {
      deleteProject(id);
      setProjects(getProjects());
    }
  };

  const handleReturnLibrary = () => {
    if (currentProject) saveProject(currentProject, treeData);
    setView('LIBRARY');
    setProjects(getProjects());
  };

  // --- Editor Actions ---
  const handleToggle = (id: string) => {
    const toggleNode = (nodes: NovelNode[]): NovelNode[] => {
      return nodes.map(node => {
        if (node.id === id) return { ...node, isExpanded: !node.isExpanded };
        if (node.children) return { ...node, children: toggleNode(node.children) };
        return node;
      });
    };
    setTreeData(toggleNode(treeData));
  };

  // --- AI Actions ---
  const handleAIAction = async (type: string, params: any = {}) => {
    setIsGenerating(true);
    setContinuityReport(null);

    const contextPath = selectedNode ? `${selectedNode.type} "${selectedNode.title}"` : 'New Project';
    const nextNodeTitle = nextNodeObject ? nextNodeObject.title : undefined;

    try {
      const result = await generateNovelContent(
        type, 
        selectedNode?.type || 'NOVEL', 
        contextPath, 
        selectedNode?.content || '',
        { 
          topic: promptTopic || params.topic, 
          nextNodeTitle,
          previousContext: selectedNode?.summary || "Dựa trên mạch truyện hiện tại.",
          projectOverview,
          ...params 
        }
      );

      if (type === 'NEW_PROJECT') {
        const json = JSON.parse(result);
        const strictOverview = `[CỐT TRUYỆN GỐC (BẤT BIẾN)]: ${params.topic}\n\n[MỞ RỘNG CHI TIẾT]: ${json.overview}`;

        const newRoot: NovelNode = {
          id: 'root',
          type: 'NOVEL',
          title: json.title,
          summary: json.summary,
          overview: strictOverview,
          content: '',
          isExpanded: true,
          children: json.structure.map((item: any, idx: number) => ({
             id: `part_${idx}`,
             type: item.type as NodeType,
             title: item.title,
             summary: item.summary,
             content: '',
             children: [],
             isExpanded: false
          }))
        };

        // Create Project Meta
        const newProject: ProjectMeta = {
          id: `proj_${Date.now()}`,
          title: json.title,
          overview: strictOverview,
          lastModified: Date.now()
        };

        saveProject(newProject, [newRoot]);
        setProjects(getProjects()); // Refresh library list
        setCurrentProject(newProject);
        setTreeData([newRoot]);
        setSelectedId('root');
        setShowNewProjectModal(false);
        setNewProjectIdea('');
        setView('EDITOR');
      }
      else if (type === 'WRITE') {
        const newContent = selectedNode!.content + "\n\n" + result;
        setTreeData(updateNodeContent(treeData, selectedId, { content: newContent }));
      }
      else if (type === 'CONNECT_NODES') {
        // Seamlessly connect current end to next start
        if (nextNodeObject) {
          const json = JSON.parse(result);
          const currentEndContent = selectedNode!.content + "\n\n" + json.endCurrent;
          const nextStartContent = json.startNext + "\n\n" + nextNodeObject.content;
          
          setTreeData(updateLinkedNodes(
            treeData, 
            selectedId, currentEndContent,
            nextNodeObject.id, nextStartContent
          ));
          // Notify user
          alert(`Đã nối thành công "${selectedNode?.title}" với "${nextNodeObject.title}"`);
        }
      }
      else if (type === 'TITLE') {
        setTreeData(updateNodeContent(treeData, selectedId, { title: result.trim() }));
      }
      else if (type === 'SUMMARIZE') {
        const json = JSON.parse(result);
        setTreeData(updateNodeContent(treeData, selectedId, { summary: json.TomTat }));
      }
      else if (type === 'END_TRANSITION') {
        const json = JSON.parse(result);
        const transitionBlock = `
***
${json.KetThuc}
${json.ChuyenCanh}
`;
        const newContent = selectedNode!.content + "\n" + transitionBlock;
        setTreeData(updateNodeContent(treeData, selectedId, { content: newContent }));
      }
      else if (type === 'CONTINUITY_CHECK') {
        setContinuityReport(JSON.parse(result));
        setActiveTab('TOOLS'); 
      }
      else if (type === 'STRUCTURE') {
        const json = JSON.parse(result);
        const childTypeMap: Record<string, NodeType> = {
          'NOVEL': 'PART',
          'PART': 'CHAPTER',
          'CHAPTER': 'ACT',
          'ACT': 'SCENE',
          'SCENE': 'SCENE'
        };
        const nextType = childTypeMap[selectedNode!.type] || 'SCENE';
        
        const newChildren: NovelNode[] = json.map((item: any, idx: number) => ({
          id: `${selectedId}_sub_${Date.now()}_${idx}`,
          type: nextType,
          title: item.title,
          content: '',
          summary: item.summary,
          children: [],
          isExpanded: false
        }));
        setTreeData(addChildrenToNode(treeData, selectedId, newChildren));
      }

    } catch (e) {
      alert("Có lỗi xảy ra khi gọi AI: " + e);
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Exports ---
  const handleExport = async (format: 'TXT' | 'DOC' | 'MP4') => {
    if (!currentProject) return;
    const title = selectedNode ? selectedNode.title : currentProject.title;
    // If selecting root, export whole book. If selecting leaf, export leaf.
    const nodesToExport = selectedNode?.type === 'NOVEL' ? treeData : (selectedNode ? [selectedNode] : []);
    
    if (nodesToExport.length === 0) return;

    if (format === 'TXT') exportToTXT(nodesToExport, title);
    if (format === 'DOC') exportToDOC(nodesToExport, title);
    if (format === 'MP4') {
       if (confirm("Quá trình tạo video (MP4) sẽ ghi hình lại nội dung text đang cuộn. Việc này có thể mất vài phút. Bạn có muốn tiếp tục?")) {
          const text = nodesToExport.map(n => n.content).join("\n\n");
          await exportToMP4(text, title);
       }
    }
  };

  // --- TTS ---
  const handleSpeak = () => {
    if (!selectedNode?.content) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(selectedNode.content);
    utterance.lang = 'vi-VN';
    utterance.rate = voiceRate;
    utterance.onend = () => setIsSpeaking(false);
    const voices = window.speechSynthesis.getVoices();
    const vnVoice = voices.find(v => v.lang.includes('vi'));
    if (vnVoice) utterance.voice = vnVoice;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };
  useEffect(() => { window.speechSynthesis.getVoices(); }, []);

  // --- RENDER: LIBRARY VIEW ---
  if (view === 'LIBRARY') {
    return (
      <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
             <div className="flex justify-between items-center mb-8">
               <h2 className="text-3xl font-serif text-amber-500 font-bold flex items-center gap-3">
                 <Library size={32} /> Thư Viện Của Tôi
               </h2>
               <button 
                onClick={() => setShowNewProjectModal(true)} 
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:shadow-lg hover:shadow-amber-500/20 text-white rounded-lg font-bold flex items-center gap-2 transition"
              >
                <PlusCircle size={20} /> Tạo Dự Án Mới
              </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {projects.map(p => (
                 <div key={p.id} 
                      onClick={() => handleOpenProject(p)}
                      className="group bg-slate-900 border border-white/5 hover:border-amber-500/50 rounded-xl p-6 cursor-pointer transition-all hover:transform hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden"
                 >
                   <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={(e) => handleDeleteProject(p.id, e)} className="p-2 bg-red-900/50 text-red-400 rounded-full hover:bg-red-800">
                        <Trash2 size={16} />
                      </button>
                   </div>
                   <div className="flex items-center gap-2 text-amber-500 mb-3">
                     <Book size={24} />
                     <span className="text-xs font-bold uppercase tracking-widest opacity-70">Tiểu Thuyết</span>
                   </div>
                   <h3 className="text-xl font-bold font-serif text-slate-100 mb-2 line-clamp-2 group-hover:text-amber-400 transition-colors">
                     {p.title}
                   </h3>
                   <p className="text-slate-400 text-sm line-clamp-3 mb-4 h-16">
                     {p.overview.replace(/\[.*?\]/g, '').trim()}
                   </p>
                   <div className="text-xs text-slate-600 pt-4 border-t border-white/5 flex justify-between items-center">
                     <span>Cập nhật: {new Date(p.lastModified).toLocaleDateString('vi-VN')}</span>
                     <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                 </div>
               ))}
               
               {projects.length === 0 && (
                 <div className="col-span-full py-20 text-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                   <p className="mb-4 text-lg">Chưa có dự án nào.</p>
                   <button onClick={() => setShowNewProjectModal(true)} className="text-amber-500 underline hover:text-amber-400">Bắt đầu viết ngay</button>
                 </div>
               )}
             </div>
          </div>
        </main>
        
        {/* New Project Modal (Shared) */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-500/30 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
              <div className="p-6">
                  <h2 className="text-2xl font-serif text-amber-500 mb-4 flex items-center gap-2">
                    <Wand2 className="w-6 h-6" /> Khởi Tạo Dự Án Mới
                  </h2>
                  <p className="text-slate-400 text-sm mb-4">
                    Nhập ý tưởng cốt truyện. Hệ thống sẽ tạo cấu trúc và lưu vào thư viện.
                  </p>
                  <textarea 
                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-lg p-3 text-slate-200 focus:border-amber-500 focus:outline-none mb-4 resize-none"
                    placeholder="Ví dụ: Huyền thoại về người cuối cùng giữ lửa..."
                    value={newProjectIdea}
                    onChange={(e) => setNewProjectIdea(e.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowNewProjectModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Hủy</button>
                    <button 
                      onClick={() => handleAIAction('NEW_PROJECT', { topic: newProjectIdea })}
                      disabled={isGenerating || !newProjectIdea.trim()}
                      className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {isGenerating ? 'Đang khởi tạo...' : 'Xác nhận'} <Wand2 size={16} />
                    </button>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER: EDITOR VIEW ---
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <div className="relative z-50 flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/5">
         <div className="flex items-center gap-4">
           <button onClick={handleReturnLibrary} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold uppercase tracking-wider">
             <Library size={16} /> Thư Viện
           </button>
           <span className="text-slate-600">/</span>
           <span className="text-amber-500 font-serif font-bold truncate max-w-xs">{currentProject?.title}</span>
         </div>
         <div className="flex items-center gap-2 text-xs text-slate-500">
           {isGenerating ? <Activity size={14} className="animate-spin text-amber-500" /> : <Save size={14} />}
           <span>{isGenerating ? 'Đang viết...' : 'Tự động lưu'}</span>
         </div>
      </div>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-slate-900/50 border-r border-white/5 flex flex-col backdrop-blur-sm z-10">
          <div className="flex-1 overflow-y-auto p-2">
            <TreeEditor 
              nodes={treeData} 
              selectedId={selectedId} 
              onSelect={setSelectedId} 
              onToggle={handleToggle}
            />
          </div>
          <div className="p-4 border-t border-white/5">
             {projectOverview && (
               <div className="text-[10px] text-slate-500 line-clamp-3 italic opacity-50 hover:opacity-100 transition-opacity">
                 {projectOverview}
               </div>
             )}
          </div>
        </aside>

        {/* Main Editor */}
        <section className="flex-1 flex flex-col relative bg-slate-950">
          {selectedNode ? (
            <>
              {/* Context Bar */}
              <div className="h-12 border-b border-white/5 flex items-center px-6 justify-between bg-slate-900/30">
                <div className="flex items-center text-sm text-slate-400">
                  <span className="text-amber-500 font-bold mr-2">[{selectedNode.type}]</span>
                  <span className="truncate max-w-md font-serif text-slate-200">{selectedNode.title}</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1 bg-slate-800 rounded-full px-2 py-1">
                      <button onClick={() => setVoiceRate(r => Math.max(0.5, r - 0.25))} className="text-xs px-1 text-slate-400 hover:text-white">-</button>
                      <span className="text-xs text-amber-500 w-8 text-center">{voiceRate}x</span>
                      <button onClick={() => setVoiceRate(r => Math.min(2, r + 0.25))} className="text-xs px-1 text-slate-400 hover:text-white">+</button>
                   </div>
                   <button 
                      onClick={handleSpeak}
                      className={`p-2 rounded-full transition-all ${isSpeaking ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400'}`}
                    >
                      {isSpeaking ? <StopCircle size={18} /> : <Volume2 size={18} />}
                   </button>
                </div>
              </div>

              {/* Tools Tabs */}
              <div className="flex items-center gap-6 px-6 py-4 bg-slate-900/20 border-b border-white/5">
                {[
                  { id: 'WRITE', label: 'Sáng tác', icon: Wand2 },
                  { id: 'STRUCTURE', label: 'Cấu trúc', icon: GitBranch },
                  { id: 'TOOLS', label: 'Công cụ VIP', icon: Settings },
                  { id: 'EXPORT', label: 'Xuất File', icon: Download },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors
                      ${activeTab === tab.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-300'}
                    `}
                  >
                    <tab.icon size={16} /> {tab.label}
                  </button>
                ))}
              </div>

              {/* Action Panel */}
              <div className="px-6 py-4 bg-slate-900/20 shadow-inner">
                {activeTab === 'STRUCTURE' && (
                   <div className="flex gap-3 items-center">
                     <span className="text-sm text-slate-400">Tự động sinh các mục con cho node hiện tại:</span>
                     <button 
                       onClick={() => handleAIAction('STRUCTURE')}
                       disabled={isGenerating}
                       className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2"
                     >
                       <GitBranch size={16} /> Tạo cấu trúc cây
                     </button>
                   </div>
                )}

                {activeTab === 'TOOLS' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleAIAction('TITLE')} disabled={isGenerating} className="tool-btn">
                        <Type size={14} /> Đặt Tiêu Đề
                      </button>
                      <button onClick={() => handleAIAction('SUMMARIZE')} disabled={isGenerating} className="tool-btn">
                        <FileText size={14} /> Tóm Tắt (JSON)
                      </button>
                      <button onClick={() => handleAIAction('CONTINUITY_CHECK')} disabled={isGenerating} className="tool-btn bg-blue-900/50 border-blue-500/30 hover:bg-blue-800 text-blue-200">
                        <Activity size={14} className="text-blue-400"/> Kiểm Tra Mạch Truyện
                      </button>
                    </div>
                    {continuityReport && (
                        <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-lg text-sm text-blue-200 shadow-lg mt-2">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="bg-blue-900/20 p-2 rounded">
                               <span className="block text-xs text-blue-500 font-bold mb-1 uppercase">Nhân vật</span>
                               <p className="text-xs opacity-90">{continuityReport.TinhOnDinhNhanVat}</p>
                             </div>
                             <div className="bg-blue-900/20 p-2 rounded">
                               <span className="block text-xs text-blue-500 font-bold mb-1 uppercase">Sự kiện</span>
                               <p className="text-xs opacity-90">{continuityReport.TinhLienMachSuKien}</p>
                             </div>
                             <div className="bg-blue-900/20 p-2 rounded">
                               <span className="block text-xs text-blue-500 font-bold mb-1 uppercase">Khuyến nghị</span>
                               <p className="text-xs opacity-90">{continuityReport.LoiKhuyenDieuChinh}</p>
                             </div>
                           </div>
                        </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'EXPORT' && (
                   <div className="flex gap-4">
                      <button onClick={() => handleExport('TXT')} className="tool-btn bg-slate-800">
                         <FileText size={16} /> Xuất .TXT
                      </button>
                      <button onClick={() => handleExport('DOC')} className="tool-btn bg-blue-900/50 border-blue-500/30 text-blue-200">
                         <FileText size={16} /> Xuất .DOC (Word)
                      </button>
                      <button onClick={() => handleExport('MP4')} className="tool-btn bg-purple-900/50 border-purple-500/30 text-purple-200">
                         <Film size={16} /> Xuất .MP4 (Video Cuộn Text)
                      </button>
                   </div>
                )}
              </div>

              {/* Editor */}
              <div className="flex-1 relative group flex flex-col">
                 <textarea
                  className="flex-1 w-full bg-slate-950 p-8 pb-32 text-lg leading-relaxed text-slate-300 resize-none focus:outline-none custom-scrollbar font-serif selection:bg-amber-500/30"
                  value={selectedNode.content}
                  placeholder="Nội dung sẽ hiển thị ở đây. Hãy bắt đầu sáng tác..."
                  onChange={(e) => setTreeData(updateNodeContent(treeData, selectedId, { content: e.target.value }))}
                />
                
                {/* Flow Control Bar */}
                {activeTab === 'WRITE' && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] md:w-[80%] bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center gap-2 z-30 transition-all hover:border-amber-500/30">
                     <div className="flex-1 flex gap-2">
                        <input 
                           type="text" 
                           placeholder="Hướng triển khai tiếp theo..." 
                           className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-amber-500 focus:outline-none placeholder-slate-500"
                           value={promptTopic}
                           onChange={(e) => setPromptTopic(e.target.value)}
                         />
                     </div>
                     <button 
                       onClick={() => handleAIAction('WRITE')}
                       disabled={isGenerating}
                       className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 min-w-[80px]"
                     >
                       <PenLine size={16} /> Viết Tiếp
                     </button>
                     <button 
                        onClick={() => handleAIAction('END_TRANSITION')} 
                        disabled={isGenerating} 
                        className="px-4 py-3 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/20 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 min-w-[80px]"
                      >
                        <CheckCircle2 size={16} /> Kết Thúc
                      </button>
                     {nextNodeObject ? (
                       <button 
                         onClick={() => handleAIAction('CONNECT_NODES')}
                         disabled={isGenerating}
                         className="px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:shadow-lg hover:shadow-amber-500/20 text-white rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 min-w-[120px]"
                         title={`Nối sang: ${nextNodeObject.title}`}
                       >
                         <MoveRight size={16} /> 
                         <span className="truncate max-w-[100px] text-[10px]">{nextNodeObject.title}</span>
                       </button>
                     ) : (
                       <div className="px-4 py-3 opacity-50 text-slate-500 text-xs text-center flex flex-col items-center min-w-[120px]">
                         <MoveRight size={16} /> Cuối Truyện
                       </div>
                     )}
                  </div>
                )}
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
              <Book size={64} className="mb-4 opacity-20" />
              <p>Chọn một mục từ cây bên trái để bắt đầu</p>
            </div>
          )}
        </section>
      </main>

      <style>{`
        .tool-btn {
          @apply px-3 py-2 bg-slate-800 border border-white/5 rounded hover:bg-slate-700 hover:text-white text-slate-400 text-xs font-medium transition flex items-center gap-2;
        }
      `}</style>
    </div>
  );
}

export default App;
