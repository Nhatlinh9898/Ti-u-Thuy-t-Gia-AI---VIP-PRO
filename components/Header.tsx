import React from 'react';
import { Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="relative w-full py-6 bg-gradient-to-r from-slate-950 via-[#1a103c] to-slate-950 border-b border-white/10 shadow-2xl z-50">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
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
