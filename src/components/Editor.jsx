import React, { useRef } from 'react';
import { FileUp, Edit3, Trash2, Copy, FileText, UploadCloud, Type, Minus, Plus } from 'lucide-react';

const Editor = ({ 
  markdown, 
  setMarkdown, 
  mode, 
  onModeChange, 
  fontSize, 
  setFontSize, 
  fontFamily, 
  setFontFamily 
}) => {
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.md') || file.name.endsWith('.markdown'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMarkdown(e.target.result);
        if (mode === 'upload') onModeChange('text');
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a valid .md file');
    }
  };

  const fontFamilies = [
    { name: 'Sans', value: 'sans-serif' },
    { name: 'Serif', value: 'serif' },
    { name: 'Mono', value: 'monospace' }
  ];

  const fontSizes = [
    { name: 'S', value: '12px' },
    { name: 'M', value: '16px' },
    { name: 'L', value: '20px' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full relative transition-colors duration-300 bg-white">
      {/* Editor Header */}
      <div className="h-10 border-b px-4 flex items-center justify-between font-semibold text-[10px] uppercase tracking-widest shadow-sm border-lightGray bg-white text-darkGray">
        <div className="flex items-center gap-2">
          <Edit3 size={14} className="text-primary" />
          <span>Editor {mode === 'upload' ? '(Docs Mode)' : ''}</span>
        </div>

        {/* Stage 2: Font Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border-r border-lightGray pr-3">
            <Type size={12} className="text-mediumGray" />
            <select 
              value={fontFamily} 
              onChange={(e) => setFontFamily(e.target.value)}
              className="bg-transparent border-none outline-none text-[9px] font-bold cursor-pointer hover:text-primary transition-colors"
            >
              {fontFamilies.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1 border-r border-lightGray pr-3">
            <span className="text-mediumGray text-[9px]">Size</span>
            <select 
              value={fontSize} 
              onChange={(e) => setFontSize(e.target.value)}
              className="bg-transparent border-none outline-none text-[9px] font-bold cursor-pointer hover:text-primary transition-colors"
            >
              {fontSizes.map(s => <option key={s.value} value={s.value}>{s.name}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-4 pl-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".md"
              className="hidden"
            />
            <button 
              onClick={() => onModeChange(mode === 'text' ? 'upload' : 'text')}
              className="flex items-center gap-1.5 transition-colors text-[9px] px-2 py-1 rounded-md border border-lightGray hover:bg-primary hover:text-white"
            >
              {mode === 'text' ? <FileUp size={12} /> : <Edit3 size={12} />}
              <span>{mode === 'text' ? 'Switch to Upload' : 'Switch to Text'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex flex-col p-4">
        {mode === 'text' ? (
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Paste your markdown here..."
            className="flex-1 w-full p-4 resize-none focus:outline-none leading-relaxed transition-colors duration-300 bg-white text-darkGray"
            style={{ 
              fontSize: fontSize, 
              fontFamily: fontFamily === 'monospace' ? '"JetBrains Mono", monospace' : fontFamily 
            }}
            spellCheck="false"
          />
        ) : (
          /* UPLOAD MODE VIEW */
          <div 
            onClick={() => fileInputRef.current.click()}
            className="flex-1 flex flex-col items-center justify-center m-4 border-2 border-dashed rounded-3xl cursor-pointer transition-all hover:scale-[0.99] group border-lightGray bg-white hover:bg-lightGray/10"
          >
            <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl transition-transform group-hover:scale-110 bg-lightGray/20 text-mediumGray">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-bold mb-1 text-primary">Import Document</h3>
            <p className="text-xs opacity-50 uppercase font-black tracking-widest">Select or Drag .md file</p>
            <div className="mt-6 px-6 py-2 rounded-xl text-xs font-bold transition-all bg-primary text-white shadow-lg">
              Browse Files
            </div>
          </div>
        )}
      </div>
      
      {/* Floating Indicator */}
      <div className="absolute right-4 bottom-4 px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter rounded-full border border-mediumGray bg-lightGray text-darkGray opacity-50 transition-all select-none">
        UTF-8 • MD
      </div>
    </div>
  );
};

export default Editor;
