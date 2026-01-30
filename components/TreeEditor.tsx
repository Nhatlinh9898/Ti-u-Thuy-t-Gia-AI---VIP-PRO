import React from 'react';
import { NovelNode } from '../types';
import { ChevronRight, ChevronDown, FileText, Book, Folder, Layers, Hash } from 'lucide-react';

interface TreeEditorProps {
  nodes: NovelNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

const NodeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'NOVEL': return <Book size={16} className="text-amber-500" />;
    case 'PART': return <Layers size={16} className="text-purple-400" />;
    case 'CHAPTER': return <Folder size={16} className="text-blue-400" />;
    case 'ACT': return <Hash size={16} className="text-emerald-400" />;
    case 'SCENE': return <FileText size={16} className="text-gray-400" />;
    default: return <FileText size={16} />;
  }
};

const TreeNode: React.FC<{
  node: NovelNode;
  selectedId: string | null;
  level: number;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}> = ({ node, selectedId, level, onSelect, onToggle }) => {
  const isSelected = node.id === selectedId;
  const hasChildren = node.children.length > 0;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-colors duration-200 border-l-2
          ${isSelected 
            ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-medium' 
            : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onToggle(node.id);
          }}
          className={`p-1 rounded hover:bg-white/10 ${hasChildren ? 'visible' : 'invisible'}`}
        >
          {node.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
        
        <NodeIcon type={node.type} />
        
        <span className="truncate text-sm">{node.title}</span>
      </div>

      {node.isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              level={level + 1}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeEditor: React.FC<TreeEditorProps> = ({ nodes, selectedId, onSelect, onToggle }) => {
  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          selectedId={selectedId}
          level={0}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};
