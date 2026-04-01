import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Actions from './components/Actions';
import { Info, FileText, CheckCircle } from 'lucide-react';

const App = () => {
  const [markdown, setMarkdown] = useState('# Markdown Studio\n\nWelcome to **Markdown Studio**! \n\n### Features:\n- Live Preview\n- PDF Export\n- Clean 16:9 UI\n\n```javascript\nconsole.log("Happy Coding!");\n```\n\n| Item | Status |\n|------|--------|\n| Build | Done ✅ |\n| Style | B&W 🖤 |\n\nEnjoy using this tool!');

  const [view, setView] = useState('editor'); // 'editor' | 'about'
  const [editorMode, setEditorMode] = useState('text'); // 'text' | 'upload'
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [fontSize, setFontSize] = useState('16px');
  const [fontFamily, setFontFamily] = useState('sans');
  const [fontColor, setFontColor] = useState('black');
  const [border, setBorder] = useState('none');
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'

  const handleClear = () => {
    setMarkdown('');
    setEditorMode('text');
  };

  const handleLoadSample = () => {
    if (!markdown.trim()) {
      setMarkdown('# Sample Document\n\n## Introduction\nMarkdown is a lightweight markup language that allows you to format text using simple syntax.\n\n### List Example:\n1. First item\n2. Second item\n3. Third item\n\n### Table Example:\n| Name | Role | Location |\n| :--- | :--- | :--- |\n| Alice | Designer | New York |\n| Bob | Developer | London |\n| Carol | Manager | Tokyo |\n\n### Code Block:\n```python\ndef hello_world():\n    print("Hello from Markdown Studio!")\n```\n\n> "Simplicity is the ultimate sophistication." - Leonardo da Vinci\n\n[Link to Google](https://google.com)\n\n![Placeholder Image](https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=500&auto=format&fit=crop)');
    } else {
      setMarkdown(prev => prev + ' ');
      setTimeout(() => setMarkdown(prev => prev.slice(0, -1)), 0);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const toggleView = () => {
    setView(prev => prev === 'editor' ? 'about' : 'editor');
  };

  const toggleDocs = () => {
    setEditorMode(prev => prev === 'text' ? 'upload' : 'text');
    setView('editor');
  };

  return (
    <div className="fixed inset-0 transition-colors duration-300 bg-[#E5E5E5] overflow-hidden">
      {/* Main Container - Full Screen 100% Layout */}
      <div className="w-full h-full overflow-hidden flex flex-col transition-all duration-300 bg-white">

        {/* Top Navbar */}
        <Navbar
          onAbout={toggleView}
          onDocs={toggleDocs}
          currentView={view}
        />

        {/* Mobile Tab Switcher - Only visible on small screens when in editor view */}
        {view === 'editor' && (
          <div className="md:hidden flex border-b bg-[#F9F9F9] border-lightGray">
            <button 
              onClick={() => setMobileTab('editor')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${mobileTab === 'editor' ? 'bg-white text-primary border-b-2 border-primary' : 'text-mediumGray opacity-60'}`}
            >
              <FileText size={14} />
              Editor
            </button>
            <button 
              onClick={() => setMobileTab('preview')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${mobileTab === 'preview' ? 'bg-white text-primary border-b-2 border-primary' : 'text-mediumGray opacity-60'}`}
            >
              <CheckCircle size={14} />
              Preview
            </button>
          </div>
        )}

        {/* Main Section */}
        <div className="flex-1 w-full flex flex-col md:flex-row overflow-hidden border-t border-lightGray min-h-0">
          {view === 'editor' ? (
            <>
              {/* LEFT - Editor */}
              <div className={`flex-1 w-full md:w-1/2 min-h-0 md:border-r flex flex-col transition-colors duration-300 bg-white border-lightGray ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
                <Editor
                  markdown={markdown}
                  setMarkdown={setMarkdown}
                  mode={editorMode}
                  onModeChange={setEditorMode}
                  fontSize={fontSize}
                  setFontSize={setFontSize}
                  fontFamily={fontFamily}
                  setFontFamily={setFontFamily}
                  fontColor={fontColor}
                  setFontColor={setFontColor}
                  border={border}
                  setBorder={setBorder}
                />
              </div>

              {/* RIGHT - Preview */}
              <div className={`flex-1 w-full md:w-1/2 min-h-0 flex flex-col transition-colors duration-300 bg-[#F9F9F9] ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
                <Preview
                  markdown={markdown}
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  fontColor={fontColor}
                  border={border}
                />
              </div>
            </>
          ) : (
            /* ABOUT VIEW - Scrollable and Themed (Permanent Light) */
            <div className="flex-1 overflow-y-auto px-12 py-16 transition-colors duration-300 bg-[#F9F9F9] text-primary">
              <div className="max-w-2xl mx-auto text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl shadow-xl bg-primary text-white">
                  <Info size={32} />
                </div>
                <h1 className="text-4xl font-black mb-4 tracking-tighter text-primary">Markdown Studio</h1>
                <p className="text-lg mb-8 leading-relaxed text-darkGray">
                  Markdown Studio is a premium, minimalist web application designed for high-fidelity markdown editing and real-time previewing. Seamlessly transform your text into beautiful documents and export them with a single click.
                </p>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="p-5 rounded-xl border border-lightGray bg-white">
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-primary">
                      <CheckCircle size={18} className="text-primary" /> Features
                    </h3>
                    <ul className="text-sm space-y-2 text-darkGray opacity-90">
                      <li>• Real-time Preview</li>
                      <li>• PDF Export Tool</li>
                      <li>• Direct File Upload</li>
                      <li>• Clickable PDF Links</li>
                    </ul>
                  </div>
                  <div className="p-5 rounded-xl border border-lightGray bg-white">
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-primary">
                      <CheckCircle size={18} className="text-primary" /> Technical
                    </h3>
                    <ul className="text-sm space-y-2 text-darkGray opacity-90">
                      <li>• GFM Support</li>
                      <li>• Syntax Highlighting</li>
                      <li>• Premium Monochrome UI</li>
                      <li>• Web Share API</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-12 pt-8 border-t border-lightGray/10">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40 text-primary">Developed by Shrikanth</p>
                </div>
                <button
                  onClick={() => setView('editor')}
                  className="mt-10 px-10 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-xl bg-primary text-white hover:bg-darkGray"
                >
                  Return to Editor
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar - Conditional Render */}
        {view === 'editor' && (
          <Actions
            onLoadSample={handleLoadSample}
            onCopy={handleCopy}
            onClear={handleClear}
            markdown={markdown}
            copyFeedback={copyFeedback}
          />
        )}

      </div>
    </div>
  );
};

export default App;
