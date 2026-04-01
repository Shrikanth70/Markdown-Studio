import React from 'react';
import { Layout, Info, FileText, Save, Download, HelpCircle } from 'lucide-react';
import { exportToPdf } from '../utils/pdfExport';

const Navbar = ({ onAbout, onDocs, currentView }) => {
  const downloadPdf = () => {
    const filename = window.prompt("Enter filename for your PDF:", "markdown-studio-export.pdf");
    if (filename !== null) {
      // New Engine automatically targets all .document-page elements
      exportToPdf(filename || 'markdown-studio-export.pdf');
    }
  };

  return (
    <nav className="h-14 flex items-center justify-between px-4 md:px-6 border-b z-20 shadow-sm transition-colors duration-300 bg-white border-lightGray text-primary">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg shadow-md bg-primary text-white">
          <FileText size={20} />
        </div>
        <span className="font-bold text-base md:text-lg tracking-tight select-none text-primary">Markdown Studio</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={onAbout}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:bg-lightGray/10 active:scale-95 ${currentView === 'about' ? 'bg-lightGray/20 shadow-inner' : 'text-darkGray'}`}
        >
          <Info size={16} />
          <span className="hidden md:inline">About</span>
        </button>
        <button 
          onClick={onDocs}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:bg-lightGray/10 active:scale-95 text-darkGray"
        >
          <Layout size={16} />
          <span className="hidden md:inline italic">Docs Mode</span>
        </button>
        
        <div className="h-6 w-px mx-0.5 md:mx-1 bg-lightGray"></div>
        
        <button 
          onClick={downloadPdf}
          className="flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all transform active:scale-95 shadow-md uppercase tracking-wider bg-primary text-white hover:bg-darkGray"
        >
          <Download size={14} />
          <span className="hidden md:inline">Download PDF</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
