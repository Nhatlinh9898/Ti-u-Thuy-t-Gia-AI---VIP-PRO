
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TreeEditor } from './components/TreeEditor';
import { NovelNode, ProjectMeta } from './types';
import { generateNovelContent } from './services/aiService';
import { saveProject, loadProjectContent, getProjects, deleteProject } from './services/storage';
import { exportProjectJSON, importProjectJSON } from './services/fileSystem';
import { getSavedSettings, saveSettings, AISettings } from './config';
import { 
  Save, Book, PlusCircle, Activity, 
  PenLine, Library, RefreshCw, FileJson, 
  X, AlertCircle, Info, CheckCircle2, Globe, Cpu, Zap, Trash2,
  Sparkles, FileUp, Share2, Settings as SettingsIcon, Sliders
} from 'lucide-react';

// --- SUB-COMPONENTS ---

const Toast = ({ message, type, onClose }: any) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const colors = { 
    info: 'border-blue-500 bg-blue-500/10 text-blue-400', 
    error: 'border-red-500 bg-red-500/10 text-red-400', 
    success: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
  };
  const Icons: any = { info: Info, error: AlertCircle, success: CheckCircle2 };
  const Icon = Icons[type];
  return (
    <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl animate-bounce-in ${colors[type as keyof typeof colors]}`}>
      <Icon size={18} />
      <span className="text-[10px] font-black uppercase tracking-wider">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-50"><X size={14} /></button>
    </div>
  );
};

const SettingsModal = ({ isOpen, onClose, onSave }: any) => {
  const [localSettings, setLocalSettings] = useState<AISettings>(getSavedSettings());
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-scale-in">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-serif font-black text-amber-500 uppercase tracking-tighter flex items-center gap-3">
            <SettingsIcon size={24} /> CẤU HÌNH HỆ THỐNG
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={24} /></button>
        </div>
        
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3">Mô hình AI (Model)</label>
            <select 
              className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:border-amber-500/50"
              value={localSettings.model}
              onChange={(e) => setLocalSettings({...localSettings, model: e.target.value})}
            >
              <option value="gemini-3-flash-preview">Gemini 3 Flash (Nhanh & Ổn định)</option>
              <option value="gemini-3-pro-preview">Gemini 3 Pro (Sâu sắc & Tư duy cao)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Độ sáng tạo (Temperature: {localSettings.temperature})</label>
              <Sliders size={14} className="text-amber-500/50" />
            </div>
            <input 
              type="range" min="0" max="1" step="0.1"
              className="w-full accent-amber-500"
              value={localSettings.temperature}
              onChange={(e) => setLocalSettings({...localSettings, temperature: parseFloat(e.target.value)})}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3">Chỉ thị hệ thống</label>
            <textarea 
              className="w-full h-32 bg-slate-950 border border-white/5 rounded-xl p-4 text-xs text-slate-400 outline-none focus:border-amber-500/50 resize-none"
              value={localSettings.systemInstruction}
              onChange={(e) => setLocalSettings({...localSettings, systemInstruction: e.target.value})}
            />
          </div>
        </div>

        <button 
          onClick={() => { onSave(localSettings); onClose(); }}
          className="w-full mt-10 py-4 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-600 transition shadow-xl"
        >
          ÁP DỤNG THAY ĐỔI
        </button>
      </div>
    </div>
  );
};

const InputModal = ({ title, placeholder, onConfirm, onCancel, isLoading }: any) => {
  const [val, setVal] = useState('');
  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl animate-scale-in">
        <h3 className="text-xl font-serif font-bold text-amber-500 mb-4 uppercase tracking-tighter">{title}</h3>
        <textarea 
          autoFocus
          className="w-full h-32 bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-slate-300 outline-none focus:border-amber-500/50 mb-6 resize-none"
          placeholder={placeholder}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <div className="flex flex-col gap-3">
          <button 
            disabled={!val.trim() || isLoading}
            onClick={() => onConfirm(val)}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
            KHỞI CHẠY KIẾN TRÚC AI
          </button>
          <button onClick={onCancel} className="w-full py-3 text-[10px] font-black uppercase text-slate-600 hover:text-white transition tracking-[0.2em]">Đóng lại</button>
        </div>
      </div>
    </div>
  );
};

const MegaArchitectOverlay = ({ progress, status }: { progress: number, status: string }) => (
  <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-10">
    <div className="relative w-72 h-72 mb-10">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <circle cx="50" cy="50" r="45" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray={`${progress * 2.82} 282`} strokeLinecap="round" className="transition-all duration-700 rotate-[-90deg] origin-center" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="p-4 bg-amber-500/10 rounded-full mb-3">
          <Cpu size={48} className="text-amber-500 animate-pulse" />
        </div>
        <span className="text-4xl font-black text-white">{Math.round(progress)}%</span>
      </div>
    </div>
    <div className="text-center max-w-md">
      <h3 className="text-amber-500 font-serif text-3xl font-bold mb-3 tracking-tight uppercase">Phân Tách Đa Tầng</h3>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">{status}</p>
    </div>
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectMeta | null>(null);
  const [nodes, setNodes] = useState<NovelNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [megaProgress, setMegaProgress] = useState<{ active: boolean, val: number, status: string }>({ active: false, val: 0, status: "" });
  const [view, setView] = useState<'LIBRARY' | 'EDITOR'>('LIBRARY');
  const [toasts, setToasts] = useState<any[]>([]);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const addToast = useCallback((msg: string, type: string = 'info') => {
    setToasts(p => [...p, { id: Date.now(), msg, type }]);
  }, []);

  const refreshProjects = useCallback(async () => {
    const list = await getProjects();
    setProjects(list);
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const handleOpenProject = async (id: string) => {
    const meta = projects.find(p => p.id === id);
    const content = await loadProjectContent(id);
    if (meta && content) {
      setCurrentProject(meta);
      setNodes(content);
      setSelectedId(content[0]?.id || null);
      setView('EDITOR');
    }
  };

  const handleImport = async () => {
    const data = await importProjectJSON();
    if (data) {
      await saveProject(data.meta, data.content);
      await refreshProjects();
      addToast("Khôi phục thành công!", "success");
    }
  };

  const findNode = (list: NovelNode[], id: string): NovelNode | null => {
    for (const n of list) {
      if (n.id === id) return n;
      const f = findNode(n.children, id); if (f) return f;
    }
    return null;
  };

  const updateNode = (list: NovelNode[], id: string, patch: Partial<NovelNode>): NovelNode[] => {
    return list.map(n => {
      if (n.id === id) return { ...n, ...patch };
      return { ...n, children: updateNode(n.children, id, patch) };
    });
  };

  const expandNodeWithAI = async (nodeId: string) => {
    const node = findNode(nodes, nodeId);
    if (!node || !currentProject) return;
    setIsGenerating(true);
    addToast(`Đang kiến tạo cho: ${node.title}`, "info");
    try {
      const resultRaw = await generateNovelContent('MEGA_ARCHITECT_CHILDREN', node.type, node.title, '', { 
        parentNodeTitle: node.title, 
        parentNodeSummary: node.summary || node.overview, 
        projectOverview: currentProject.overview 
      });
      const childrenData = JSON.parse(resultRaw);
      const childType = node.type === 'PART' ? 'CHAPTER' : 'SECTION';
      const newChildren: NovelNode[] = childrenData.map((c: any, i: number) => ({
        id: `${node.id}-${childType.toLowerCase()}-${Date.now()}-${i}`,
        type: childType,
        title: c.title,
        summary: c.summary,
        content: '',
        children: [],
        isExpanded: false
      }));
      const updatedNodes = updateNode(nodes, node.id, { children: [...node.children, ...newChildren], isExpanded: true });
      setNodes(updatedNodes);
      await saveProject(currentProject, updatedNodes);
      addToast(`Xong! +${newChildren.length} mục mới.`, "success");
    } catch (e: any) { addToast(`Lỗi: ${e.message}`, "error"); } 
    finally { setIsGenerating(false); }
  };

  const runMegaArchitect = async (topic: string) => {
    setShowInputModal(false);
    setMegaProgress({ active: true, val: 5, status: "KHỞI TẠO 10 PHẦN..." });
    try {
      const step1Raw = await generateNovelContent('NEW_PROJECT_MEGA_PARTS', 'NOVEL', 'Root', '', { topic });
      const step1 = JSON.parse(step1Raw);
      const newId = Date.now().toString();
      const meta = { id: newId, title: step1.title, overview: step1.overview, lastModified: Date.now() };
      let rootNode: NovelNode = {
        id: newId, type: 'NOVEL', title: step1.title, content: '', overview: step1.overview, isExpanded: true,
        children: step1.parts.map((p: any, i: number) => ({
          id: `${newId}-p${i}`, type: 'PART', title: p.title, summary: p.summary, content: '', children: [], isExpanded: true
        }))
      };
      setNodes([rootNode]);
      setCurrentProject(meta);
      await saveProject(meta, [rootNode]);
      await refreshProjects();
      setSelectedId(newId);
      setView('EDITOR');
      
      addToast("Bước 1 hoàn tất!", "success");
      setMegaProgress({ active: true, val: 20, status: "KIẾN TẠO 100 CHƯƠNG..." });
      
      for (let i = 0; i < rootNode.children.length; i++) {
        const part = rootNode.children[i];
        setMegaProgress({ active: true, val: 20 + i * 8, status: `ĐANG XỬ LÝ: ${part.title}` });
        try {
          const chaptersRaw = await generateNovelContent('MEGA_ARCHITECT_CHILDREN', 'PART', part.title, '', { 
            parentNodeTitle: part.title, parentNodeSummary: part.summary, projectOverview: meta.overview 
          });
          const chapters = JSON.parse(chaptersRaw);
          part.children = chapters.map((c: any, j: number) => ({
            id: `${part.id}-c${j}`, type: 'CHAPTER', title: c.title, summary: c.summary, content: '', children: [], isExpanded: false
          }));
          await saveProject(meta, [rootNode]);
          setNodes([rootNode]);
        } catch (err) { console.error(err); }
        await new Promise(r => setTimeout(r, 800));
      }
      addToast("Đã kiến tạo 100 chương thành công!", "success");
    } catch (e: any) { addToast(`Lỗi: ${e.message}`, 'error'); } 
    finally { setMegaProgress({ active: false, val: 0, status: "" }); }
  };

  const handleWrite = async () => {
    const node = selectedId ? findNode(nodes, selectedId) : null;
    if (!node || !currentProject) return;
    setIsGenerating(true);
    addToast("Đang chấp bút...", "info");
    try {
      const res = await generateNovelContent('WRITE', node.type, node.title, node.content, { projectOverview: currentProject.overview });
      const updated = updateNode(nodes, node.id, { content: node.content + (node.content ? "\n\n" : "") + res });
      setNodes(updated);
      await saveProject(currentProject, updated);
      addToast("Xong!", "success");
    } catch (e: any) { addToast(`Lỗi: ${e.message}`, 'error'); } 
    finally { setIsGenerating(false); }
  };

  const selectedNode = selectedId ? findNode(nodes, selectedId) : null;

  return (
    <div className="h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden flex flex-col">
      <Header />
      
      {megaProgress.active && <MegaArchitectOverlay progress={megaProgress.val} status={megaProgress.status} />}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} onSave={saveSettings} />
      
      {showInputModal && (
        <InputModal 
          title="KIẾN TẠO VŨ TRỤ"
          placeholder="Mô tả ý tưởng..."
          onConfirm={runMegaArchitect}
          onCancel={() => setShowInputModal(false)}
          isLoading={megaProgress.active}
        />
      )}

      {view === 'LIBRARY' ? (
        <main className="flex-1 overflow-y-auto p-6 md:p-12 container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-serif font-black text-amber-500 flex items-center gap-4 mb-2 uppercase tracking-tighter">
                <Globe size={40} className="text-amber-500/80" /> THƯ VIỆN DỰ ÁN
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.5em]">BACKEND HYBRID MODE READY</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSettings(true)} className="p-4 bg-slate-900 border border-white/10 text-amber-500 rounded-2xl hover:bg-slate-800 transition shadow-lg">
                <SettingsIcon size={24} />
              </button>
              <button onClick={handleImport} className="px-6 py-4 bg-slate-900 border border-white/10 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition">
                <FileUp size={20} /> NHẬP FILE
              </button>
              <button onClick={() => setShowInputModal(true)} className="px-6 py-4 bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-105 transition">
                <PlusCircle size={20} /> DỰ ÁN MỚI
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(p => (
              <div key={p.id} className="group bg-slate-900/40 border border-white/5 hover:border-amber-500/50 rounded-[2rem] p-8 cursor-pointer transition-all hover:shadow-2xl relative overflow-hidden backdrop-blur-sm">
                <div onClick={() => handleOpenProject(p.id)}>
                   <h3 className="text-2xl font-serif font-bold text-white mb-3 line-clamp-1 group-hover:text-amber-500 transition-colors">{p.title}</h3>
                   <p className="text-slate-500 text-xs line-clamp-2 mb-8 italic">"{p.overview}"</p>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{new Date(p.lastModified).toLocaleDateString()}</span>
                  <div className="flex gap-2">
                    <button onClick={async (e) => { 
                      e.stopPropagation(); 
                      const content = await loadProjectContent(p.id);
                      if(content) exportProjectJSON(p, content); 
                    }} className="p-2 bg-white/5 text-slate-400 rounded-lg hover:text-amber-500 transition"><Share2 size={16} /></button>
                    <button onClick={async (e) => { 
                      e.stopPropagation(); 
                      if(confirm("Xóa?")) { 
                        await deleteProject(p.id); 
                        await refreshProjects(); 
                      } 
                    }} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <aside className="w-full md:w-80 flex flex-col bg-slate-950 border-r border-white/5 md:h-full h-1/3">
             <div className="p-4 flex items-center justify-between border-b border-white/5">
                <button onClick={() => setView('LIBRARY')} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white flex items-center gap-2"><Library size={14} /> Thư viện</button>
                <div className="flex gap-3">
                  <button onClick={() => setShowSettings(true)} className="text-slate-500 hover:text-amber-500"><SettingsIcon size={18} /></button>
                  <button onClick={async () => { if (currentProject) { await saveProject(currentProject, nodes); addToast("Đã lưu.", "success"); } }} className="text-amber-500"><Save size={18} /></button>
                </div>
             </div>
             <div className="flex-1 overflow-hidden p-2">
                <TreeEditor nodes={nodes} selectedId={selectedId} onSelect={setSelectedId} onToggle={(id) => setNodes(updateNode(nodes, id, { isExpanded: !findNode(nodes, id)?.isExpanded }))} />
             </div>
          </aside>

          <section className="flex-1 flex flex-col relative bg-slate-950 overflow-hidden">
            {selectedNode ? (
              <>
                <div className="px-6 md:px-12 py-4 border-b border-white/5 flex items-center justify-between bg-slate-900/20">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500"><PenLine size={20} /></div>
                    <div>
                      <h2 className="text-sm md:text-lg font-serif font-black text-white line-clamp-1">{selectedNode.title}</h2>
                      <span className="text-[8px] uppercase font-black tracking-widest text-amber-500/60">{selectedNode.type}</span>
                    </div>
                  </div>
                  {(selectedNode.type === 'PART' || selectedNode.type === 'CHAPTER') && (
                    <button 
                      disabled={isGenerating}
                      onClick={() => expandNodeWithAI(selectedNode.id)}
                      className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-lg"
                    >
                      {isGenerating ? <RefreshCw className="animate-spin" size={12} /> : <PlusCircle size={12} />}
                      Mở rộng
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-20 max-w-4xl mx-auto w-full custom-scrollbar">
                  {selectedNode.summary && (
                    <div className="mb-10 p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                       <p className="text-xs md:text-sm text-slate-400 italic font-serif leading-relaxed">"{selectedNode.summary}"</p>
                    </div>
                  )}
                  <textarea 
                    className="w-full h-full bg-transparent border-none outline-none resize-none font-serif text-lg md:text-2xl leading-[1.8] text-slate-300 placeholder:text-slate-900 focus:ring-0"
                    value={selectedNode.content}
                    onChange={(e) => setNodes(updateNode(nodes, selectedId!, { content: e.target.value }))}
                    placeholder="Viết nội dung..."
                  />
                  <div className="h-40" />
                </div>

                <div className="absolute bottom-6 md:bottom-12 right-6 md:right-12 z-50">
                   <button 
                    disabled={isGenerating}
                    onClick={handleWrite}
                    className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-amber-600 to-amber-400 text-slate-950 font-black rounded-2xl shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
                   >
                     {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
                     <span className="text-xs uppercase tracking-widest">Sáng tác AI</span>
                   </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-5"><Book size={100} /></div>
            )}
          </section>
        </main>
      )}

      {toasts.map(t => <Toast key={t.id} {...t} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}

      <footer className="h-8 bg-black border-t border-white/5 flex items-center justify-between px-6 text-[8px] font-black uppercase tracking-[0.4em] text-slate-800">
         <span>BACKEND SYNC LAYER ACTIVE</span>
         <span className="hidden md:inline">SIÊU TRÍ TUỆ GIA &copy; 2025</span>
      </footer>

      <style>{`
        @keyframes bounce-in { 0% { transform: translate(-50%, 20px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
        @keyframes scale-in { 0% { transform: scale(0.98); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-bounce-in { animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}
