
import React from 'react';
import { Sparkles, Cloud, CloudOff } from 'lucide-react';
import { APP_CONFIG } from '../config';

export const Header: React.FC = () => {
  const isCloudEnabled = APP_CONFIG.BACKEND.ENABLED;

  return (
    <header className="relative w-full py-6 bg-gradient-to-r from-slate-950 via-[#1a103c] to-slate-950 border-b border-white/10 shadow-2xl z-50">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
      
      {/* Cloud Status Indicator */}
      <div className="absolute top-4 right-6 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
        {isCloudEnabled ? (
          <>
            <Cloud size={12} className="text-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Cloud Active</span>
          </>
        ) : (
          <>
            <CloudOff size={12} className="text-slate-600" />
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Local Mode</span>
          </>
        )}
      </div>

      <div className="container mx-auto flex flex-col items-center justify-center relative">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          <h2 className="text-amber-500 tracking-[0.3em] text-xs font-bold uppercase">Hệ thống kiến tạo văn học</h2>
          <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-500 drop-shadow-lg text-center">
          SIÊU APP VIP PRO
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent mt-4 rounded-full"></div>
      </div>
    </header>
  );
};
