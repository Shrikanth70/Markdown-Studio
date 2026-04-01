import React, { useRef } from 'react';
import { FileUp, Edit3, Type, Image as ImageIcon, HardDrive, Bold, Italic, UploadCloud, WrapText, CornerDownLeft } from 'lucide-react';

const Editor = ({ 
  markdown, 
  setMarkdown, 
  mode, 
  onModeChange, 
  fontSize, 
  setFontSize, 
  fontFamily, 
  setFontFamily,
  fontColor,
  setFontColor,
  border,
  setBorder
}) => {
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const selectionTracker = useRef({ start: markdown ? markdown.length : 0, end: markdown ? markdown.length : 0 });

  const updateSelection = () => {
    if (textareaRef.current) {
      selectionTracker.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      };
    }
  };

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

  const borders = [
    { name: 'None', value: 'none' },
    { name: 'Thin', value: 'thin' },
    { name: 'Medium', value: 'medium' },
    { name: 'Thick', value: 'thick' }
  ];

  const colors = [
    { name: 'Black', value: 'black' },
    { name: 'Dark Gray', value: 'dark-gray' },
    { name: 'Gray', value: 'gray' }
  ];

  const handleInsertWebImage = () => {
    const url = window.prompt("Enter image URL:", "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=500&auto=format&fit=crop");
    if (!url) return;
    const width = window.prompt("Enter image width percentage (e.g. 50%, 100%):", "100%");
    if (url && width) {
      const imgTag = `<img src="${url}" width="${width}" />`;
      if (textareaRef.current) {
        const { start, end } = selectionTracker.current;
        const newText = markdown.substring(0, start) + `\n\n${imgTag}\n\n` + markdown.substring(end);
        setMarkdown(newText);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const newPos = start + `\n\n${imgTag}\n\n`.length;
            textareaRef.current.setSelectionRange(newPos, newPos);
            updateSelection();
          }
        }, 0);
      } else {
        setMarkdown(prev => prev + `\n\n${imgTag}\n\n`);
      }
    }
  };



  const wrapSelection = (prefix, suffix = '') => {
    if (!textareaRef.current) return;
    const { start, end } = selectionTracker.current;
    
    const selectedText = markdown.substring(start, end);
    const newText = markdown.substring(0, start) + prefix + selectedText + suffix + markdown.substring(end);
    
    setMarkdown(newText);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
        updateSelection();
      }
    }, 0);
  };

  const handleFormatText = (type, value) => {
    if (type === 'bold') wrapSelection('**', '**');
    else if (type === 'italic') wrapSelection('*', '*');
    else if (type === 'color') wrapSelection(`<span style="color: ${value}">`, `</span>`);
    else if (type === 'font') wrapSelection(`<span style="font-family: '${value}'">`, `</span>`);
  };

  const handlePageBreak = () => {
    if (textareaRef.current) {
      const { start, end } = selectionTracker.current;
      const injection = `\n\n<div class="pagebreak"></div>\n\n`;
      const newText = markdown.substring(0, start) + injection + markdown.substring(end);
      setMarkdown(newText);
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + injection.length, start + injection.length);
        updateSelection();
      }, 0);
    } else {
      setMarkdown(prev => prev + `\n\n<div class="pagebreak"></div>\n\n`);
    }
  };

  const handleLineBreak = () => {
    if (textareaRef.current) {
      const { start, end } = selectionTracker.current;
      const injection = `<br/>\n`;
      const newText = markdown.substring(0, start) + injection + markdown.substring(end);
      setMarkdown(newText);
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + injection.length, start + injection.length);
        updateSelection();
      }, 0);
    } else {
      setMarkdown(prev => prev + `<br/>\n`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative transition-colors duration-300 bg-white min-w-0">
      {/* Primary Top Header */}
      <div className="h-10 border-b px-2 md:px-4 flex items-center justify-between font-semibold text-[10px] uppercase tracking-widest shadow-sm border-lightGray bg-white text-darkGray shrink-0 overflow-x-auto no-scrollbar whitespace-nowrap">
        <div className="flex items-center gap-2 shrink-0 border-r border-lightGray pr-3 md:pr-4">
          <Edit3 size={14} className="text-primary" />
          <span className="hidden sm:inline">Editor {mode === 'upload' ? '(Docs)' : ''}</span>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-auto md:ml-0 md:mr-auto pl-2">
          <div className="flex items-center gap-1 border-r border-lightGray pr-2 md:pr-3">
            <Type size={12} className="text-mediumGray" />
            <select 
              value={fontFamily} 
              onChange={(e) => setFontFamily(e.target.value)}
              className="bg-transparent border-none outline-none text-[9px] font-bold cursor-pointer hover:text-primary transition-colors"
            >
              {fontFamilies.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
          </div>
          <div className="flex flex-1 items-center gap-1 border-r border-lightGray pr-2 md:pr-3">
            <span className="text-mediumGray text-[9px]">Size</span>
            <select 
              value={fontSize} 
              onChange={(e) => setFontSize(e.target.value)}
              className="bg-transparent border-none outline-none text-[9px] font-bold cursor-pointer hover:text-primary transition-colors"
            >
              {fontSizes.map(s => <option key={s.value} value={s.value}>{s.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pl-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".md"
              className="hidden"
            />
            <button 
              onClick={() => {
                 if (mode === 'text') {
                   fileInputRef.current.click();
                 } else {
                   onModeChange('text');
                 }
              }}
              className="flex items-center gap-1.5 transition-colors text-[9px] px-2 py-1 rounded-md border border-lightGray hover:bg-primary hover:text-white"
            >
              {mode === 'text' ? <FileUp size={12} /> : <Edit3 size={12} />}
              <span className="hidden xs:inline">{mode === 'text' ? 'Upload MD' : 'Return text'}</span>
            </button>
        </div>
      </div>

      {/* Secondary Tools Header (Mobile-Friendly Formatting) */}
      {mode === 'text' && (
        <div className="h-10 border-b px-2 md:px-4 flex items-center font-semibold text-[9px] uppercase tracking-widest bg-[#F9F9F9] border-lightGray text-darkGray overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
          
          {/* Text Style Ribbon */}
          <div className="flex items-center gap-2 md:gap-3 border-r border-lightGray pr-2 md:pr-4 shrink-0">
            <button onClick={() => handleFormatText('bold')} className="flex items-center justify-center p-1 rounded hover:bg-lightGray/50 border border-transparent hover:border-lightGray transition-colors" title="Bold">
              <Bold size={14} className="text-primary"/>
            </button>
            <button onClick={() => handleFormatText('italic')} className="flex items-center justify-center p-1 rounded hover:bg-lightGray/50 border border-transparent hover:border-lightGray transition-colors" title="Italic">
              <Italic size={14} className="text-primary"/>
            </button>
            <button onClick={handlePageBreak} className="flex items-center justify-center p-1 rounded hover:bg-lightGray/50 border border-transparent hover:border-lightGray transition-colors" title="Insert Page Break">
              <WrapText size={14} className="text-primary"/>
            </button>
            <button onClick={handleLineBreak} className="flex items-center justify-center p-1 rounded hover:bg-lightGray/50 border border-transparent hover:border-lightGray transition-colors" title="Insert Line Break">
              <CornerDownLeft size={14} className="text-primary"/>
            </button>
            <div className="flex items-center gap-1 pl-1 md:pl-2 shrink-0">
               <span className="text-mediumGray hidden md:inline">Font:</span>
               <select onChange={e => { handleFormatText('font', e.target.value); e.target.value=''; }} defaultValue="" className="bg-transparent border-none outline-none font-bold cursor-pointer hover:text-primary min-w-[60px]">
                 <option value="" disabled>Custom Style...</option>
                 <option value="Arial">Arial</option>
                 <option value="Times New Roman">Times New Roman</option>
                 <option value="Courier New">Courier</option>
                 <option value="Georgia">Georgia</option>
                 <option value="Comic Sans MS">Comic Sans</option>
               </select>
            </div>
          </div>

          {/* Setup Ribbon */}
          <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 shrink-0">
            <div className="flex items-center gap-1.5 border-r border-lightGray pr-2 md:pr-4">
               <span className="text-mediumGray hidden xs:inline">App Color:</span>
               <select value={fontColor} onChange={e => setFontColor(e.target.value)} className="bg-transparent border-none outline-none font-bold cursor-pointer hover:text-primary">
                 {colors.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
               </select>
            </div>
            <div className="flex items-center gap-1.5 border-r border-lightGray pr-2 md:pr-4 hidden md:flex">
               <span className="text-mediumGray">Border:</span>
               <select value={border} onChange={e => setBorder(e.target.value)} className="bg-transparent border-none outline-none font-bold cursor-pointer hover:text-primary">
                 {borders.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
               </select>
            </div>
          </div>
          
          {/* Image Insertion Ribbon */}
          <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 shrink-0">
            <button onClick={handleInsertWebImage} className="flex items-center gap-1 text-[9px] font-bold text-primary hover:text-darkGray transition-colors cursor-pointer p-1 pr-2">
              <ImageIcon size={12} />
              <span className="hidden md:inline">Web Image</span>
              <span className="inline md:hidden">Web</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 flex flex-col p-2 md:p-4 w-full relative">
        {mode === 'text' ? (
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={(e) => { setMarkdown(e.target.value); updateSelection(); }}
            onSelect={updateSelection}
            onKeyUp={updateSelection}
            onMouseUp={updateSelection}
            placeholder="Paste your markdown here... (Highlight text to format using top bar)"
            className="flex-1 w-full h-full resize-none focus:outline-none leading-relaxed transition-colors duration-300 bg-white text-darkGray absolute inset-0 p-4 md:p-6"
            style={{ 
              fontSize: fontSize, 
              fontFamily: fontFamily === 'monospace' ? '"JetBrains Mono", monospace' : fontFamily 
            }}
            spellCheck="false"
          />
        ) : (
          <div 
            onClick={() => fileInputRef.current.click()}
            className="flex-1 flex flex-col items-center justify-center m-4 border-2 border-dashed rounded-3xl cursor-pointer transition-all hover:scale-[0.99] group border-lightGray bg-white hover:bg-lightGray/10 h-full"
          >
            <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl transition-transform group-hover:scale-110 bg-lightGray/20 text-mediumGray">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-bold mb-1 text-primary">Import Document</h3>
            <p className="text-xs opacity-50 uppercase font-black tracking-widest">Select or Drag .md file</p>
          </div>
        )}
      </div>
      
      {/* Floating Indicator */}
      {mode === 'text' && (
        <div className="absolute right-6 bottom-6 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full border border-mediumGray bg-lightGray text-darkGray opacity-40 transition-all select-none pointer-events-none hidden md:block">
          UTF-8 • MD
        </div>
      )}
    </div>
  );
};

export default Editor;
