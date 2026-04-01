import React from 'react';
import { Play, Copy, Trash2, Download, Zap, Share2, MoreHorizontal, RefreshCw, Check } from 'lucide-react';
import { exportToPdf } from '../utils/pdfExport';

const Actions = ({ onLoadSample, onCopy, onClear, markdown, copyFeedback }) => {
  const exportPdf = () => {
    const filename = window.prompt("Enter filename for your PDF:", "markdown-studio-export.pdf");
    if (filename !== null) {
      exportToPdf(filename || 'markdown-studio-export.pdf');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Markdown Studio Export',
          text: 'Check out this document from Markdown Studio!',
          url: window.location.href, 
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          exportPdf(); 
        }
      }
    } else {
      exportPdf();
    }
  };

  return (
    <div className="h-12 flex items-center justify-between px-3 md:px-6 border-t z-10 shadow-inner transition-colors duration-300 bg-white border-lightGray">
      {/* Left Sync Indicator */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-8 h-8 border rounded-lg flex items-center justify-center transition-all shadow-sm border-lightGray text-primary">
          <Zap size={16} className={`${markdown ? 'animate-pulse text-primary' : ''}`} />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-[8px] font-black text-mediumGray uppercase tracking-widest leading-none">Status</span>
          <span className="text-[10px] font-bold text-primary">{markdown ? 'SYNC_OK' : 'WAITING'}</span>
        </div>
      </div>

      {/* Center Actions */}
      <div className="flex items-center gap-1.5 md:gap-3 p-1 rounded-xl border bg-lightGray/30 border-lightGray overflow-x-auto no-scrollbar">
        <button 
          onClick={onLoadSample}
          className="flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold transition-all active:scale-95 shadow-sm group text-darkGray hover:bg-white hover:text-primary whitespace-nowrap"
          title={markdown ? "Refresh Sync" : "Load Sample"}
        >
          {markdown ? <RefreshCw size={14} className="group-hover:rotate-180 duration-500" /> : <Play size={14} />}
          <span className="hidden xs:inline">{markdown ? 'Refresh Sync' : 'Load Sample'}</span>
        </button>
        <button 
          onClick={onCopy}
          className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold transition-all active:scale-95 shadow-sm group whitespace-nowrap ${copyFeedback ? 'bg-green-600/20 text-green-500 border border-green-500/30' : 'text-darkGray hover:bg-white hover:text-primary'}`}
        >
          {copyFeedback ? <Check size={14} /> : <Copy size={14} />}
          <span className="hidden xs:inline">{copyFeedback ? 'Copied!' : 'Copy'}</span>
        </button>
        <button 
          onClick={onClear}
          className="flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold transition-all active:scale-95 shadow-sm group text-darkGray hover:bg-white hover:text-red-600 whitespace-nowrap"
        >
          <Trash2 size={14} />
          <span className="hidden xs:inline">Clear</span>
        </button>
      </div>

      {/* Right Primary Action */}
      <div className="flex items-center gap-2 md:gap-3">
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 md:gap-4 pl-3 md:pl-6 pr-2 md:pr-4 py-1.5 md:py-2 rounded-xl font-black text-[9px] uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all active:scale-95 shadow-lg group relative overflow-hidden bg-primary text-white hover:bg-darkGray"
        >
          <span className="relative z-10 hidden sm:inline">Export</span>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center relative z-10 bg-white/20">
            <Share2 size={14} />
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </button>
        <button className="p-2 border rounded-lg transition-all border-lightGray text-darkGray hover:bg-white hidden md:block">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
};

export default Actions;
