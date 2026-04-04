import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import 'highlight.js/styles/github.css';
import { Layout, FileText, Printer, CheckCircle } from 'lucide-react';

const A4_HEIGHT_PX = 1123; // at 96 DPI
const A4_WIDTH_PX = 794;

const BORDER_MAP = {
  none: 'none',
  thin: '1px solid currentColor',
  medium: '2px solid currentColor',
  thick: '4px solid currentColor'
};

const COLOR_MAP = {
  black: '#000000',
  'dark-gray': '#333333',
  gray: '#666666'
};

const VOID_ELEMENTS = ['hr', 'img', 'br', 'area', 'base', 'col', 'embed', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

const Preview = ({ markdown, border, fontColor, imageWidth }) => {
  const [pages, setPages] = useState([]);
  const [isPaginating, setIsPaginating] = useState(false);
  const [scale, setScale] = useState(0.62);
  const measurerRef = useRef(null);

  const marginPx = 96;
  const pageContentLimit = A4_HEIGHT_PX - (marginPx * 2);
  const colorStyle = COLOR_MAP[fontColor] || '#111111';
  const measurerWidth = A4_WIDTH_PX - (marginPx * 2);

  // Use outline instead of border to prevent layout shifts and pagination breakage
  const outlineStyle = BORDER_MAP[border] && border !== 'none' ? BORDER_MAP[border] : 'none';
  const outlineOffset = '16px';

  // Responsive Scaling Logic
  useEffect(() => {
    const handleResize = () => {
      const parentWidth = window.innerWidth;
      const padding = parentWidth < 768 ? 24 : 80;
      const availableWidth = parentWidth - padding;
      
      // Calculate scale to fit the A4 width within available space
      // On desktop, we want a comfortable view (at most 0.8 scale to show context)
      // On mobile, we scale to fit precisely
      let newScale;
      if (parentWidth < 768) {
        newScale = Math.min(0.65, availableWidth / A4_WIDTH_PX);
      } else if (parentWidth < 1200) {
        newScale = Math.min(0.75, (availableWidth * 0.9) / A4_WIDTH_PX);
      } else {
        newScale = 0.85; // Large desktop default
      }
      
      setScale(Math.max(0.2, newScale)); // Never scale below 0.2
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pagination Engine Logic
  const timerRef = useRef(null);

  const paginate = () => {
    setIsPaginating(true);
    const parent = measurerRef.current;
    if (!parent) return;

    let children = parent.children;
    // Unbox ReactMarkdown wrapper if present
    if (children.length === 1 && children[0].tagName.toLowerCase() === 'div' && children[0].children.length > 0) {
      children = children[0].children;
    }

    if (!children || children.length === 0) {
      setPages([]);
      setIsPaginating(false);
      return;
    }

    const atomicElements = [];

    // Decompose nested structures into atomic units
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const tag = child.tagName.toLowerCase();

      if (['ul', 'ol', 'blockquote'].includes(tag)) {
        const innerChildren = child.children;
        for (let j = 0; j < innerChildren.length; j++) {
          const inner = innerChildren[j];
          atomicElements.push({
            element: inner,
            parentTag: tag,
            isFirstInParent: j === 0,
            isLastInParent: j === innerChildren.length - 1
          });
        }
      } else if (tag === 'table') {
        // Flatten table rows
        const rows = child.querySelectorAll('tr');
        rows.forEach((row, idx) => {
          atomicElements.push({
            element: row,
            parentTag: 'table',
            isFirstInParent: idx === 0,
            isLastInParent: idx === rows.length - 1,
            isHeaderRow: row.parentElement?.tagName.toLowerCase() === 'thead'
          });
        });
      } else {
        atomicElements.push({
          element: child,
          parentTag: null
        });
      }
    }

    const newPages = [];
    let currentPage = [];
    let currentHeight = 0;

    for (let i = 0; i < atomicElements.length; i++) {
      const entry = atomicElements[i];
      const el = entry.element;

      if (el.classList && el.classList.contains('pagebreak')) {
         if (currentPage.length > 0) {
            newPages.push(currentPage);
            currentPage = [];
            currentHeight = 0;
         }
         continue;
      }

      const Tag = el.tagName.toLowerCase();
      const style = window.getComputedStyle(el);
      const marginT = parseFloat(style.marginTop || 0);
      const marginB = parseFloat(style.marginBottom || 0);

      // Precise Top Alignment (v3.2): Reset margin-top for the first element on each page
      const effectiveMarginT = currentHeight === 0 ? 0 : marginT;
      
      // Fallback height for elements that aren't yet fully laid out or have collapsed heights
      let childHeight = el.offsetHeight;
      if (childHeight === 0 && (el.innerText.trim().length > 0 || Tag === 'img')) {
        // Approximate height based on content or image placeholder if offsetHeight is zero but content exists
        childHeight = Tag === 'img' ? 300 : 24; 
      }
      
      // If a single atomic block is taller than the page, it will be clipped anyway.
      // We cap it here to ensure the engine doesn't break the layout by looking at overflow heights.
      childHeight = Math.min(childHeight, pageContentLimit);
      childHeight += effectiveMarginT + marginB;

      const isHeading = ['h1', 'h2', 'h3', 'h4'].includes(Tag);

      // Refined Heading Glue Logic (60px)
      const wouldBeAlone = isHeading && (currentHeight + childHeight + 60 > pageContentLimit);

      // Add container margins only for the first item of a split group
      if (entry.parentTag && entry.isFirstInParent) {
        const parentEl = el.closest(entry.parentTag);
        if (parentEl) {
          const parentStyle = window.getComputedStyle(parentEl);
          childHeight += parseFloat(parentStyle.marginTop || 0);
        }
      }

      // Atomic break check
      if ((currentHeight + childHeight > pageContentLimit || wouldBeAlone) && currentPage.length > 0) {
        newPages.push(currentPage);
        currentPage = [entry];
        currentHeight = childHeight;
      } else {
        currentPage.push(entry);
        currentHeight += childHeight;
      }
    }

    if (currentPage.length > 0) {
      newPages.push(currentPage);
    }

    setPages(newPages);
    setIsPaginating(false);
  };

  // Trigger pagination on data change OR content growth (images loading)
  useEffect(() => {
    const measurer = measurerRef.current;
    if (!measurer) return;

    // Monitor for size changes (handles image loads, font swaps)
    const resizeObserver = new ResizeObserver(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(paginate, 150);
    });

    resizeObserver.observe(measurer);
    
    // Initial trigger
    paginate();

    return () => {
      resizeObserver.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [markdown, pageContentLimit]);

  const renderAtomicElements = (atomicEntries) => {
    const rendered = [];
    let currentGroup = null;

    atomicEntries.forEach((entry, idx) => {
      const el = entry.element;
      const Tag = el.tagName.toLowerCase();
      const content = { __html: el.innerHTML };
      const className = el.className;

      const attributes = {};
      Array.from(el.attributes).forEach(attr => {
        if (attr.name === 'class') {
          attributes.className = attr.value;
          } else if (attr.name === 'style') {
             // More robust style parsing for React
             const styleStr = attr.value;
             if (styleStr) {
               const style = {};
               styleStr.split(';').forEach(pair => {
                 const firstColonIndex = pair.indexOf(':');
                 if (firstColonIndex !== -1) {
                    const key = pair.substring(0, firstColonIndex).trim();
                    const val = pair.substring(firstColonIndex + 1).trim();
                    const reactKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
                    style[reactKey] = val;
                 }
               });
               attributes.style = style;
             }
          } else {
            // React throws fatal errors if attribute names have invalid characters (like from malformed HTML)
            if (/^[a-zA-Z_][\w:-]*$/.test(attr.name)) {
              // Prevent empty src warning loop
              if (attr.name === 'src' && !attr.value.trim()) {
                 attributes.src = undefined;
              } else {
                 attributes[attr.name] = attr.value;
              }
            }
          }
        });

      if (entry.parentTag) {
        const ParentTag = entry.parentTag;
        if (!currentGroup || currentGroup.tag !== ParentTag) {
          currentGroup = ParentTag === 'table' ? { tag: ParentTag, headers: [], bodies: [] } : { tag: ParentTag, items: [] };
          rendered.push(currentGroup);
        }

        if (ParentTag === 'table') {
          const isHeader = entry.isHeaderRow;
          const target = isHeader ? currentGroup.headers : currentGroup.bodies;
          target.push(
            <tr key={`tr-${idx}`} dangerouslySetInnerHTML={content} className={className} />
          );
        } else {
          currentGroup.items.push(
            <Tag key={idx} dangerouslySetInnerHTML={content} className={className} />
          );
        }
      } else {
        currentGroup = null;
        if (VOID_ELEMENTS.includes(Tag)) {
          rendered.push(<Tag key={idx} {...attributes} />);
        } else {
          rendered.push(<Tag key={idx} {...attributes} dangerouslySetInnerHTML={content} />);
        }
      }
    });

    return rendered.map((node, i) => {
      if (node.tag) {
        const Container = node.tag;
        if (Container === 'table') {
          return (
            <div key={i} className="w-full overflow-x-auto no-scrollbar my-6 border border-lightGray/20 rounded-sm">
              <table className="!my-0">
                {node.headers.length > 0 && <thead>{node.headers}</thead>}
                {node.bodies.length > 0 && <tbody>{node.bodies}</tbody>}
              </table>
            </div>
          );
        }
        return <Container key={i}>{node.items}</Container>;
      }
      return node;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full relative bg-[#333333] overflow-hidden">
      {/* Document Workspace Header Bar - Blue Accent for Cache-Busting */}
      <div className="h-10 border-b px-4 flex items-center justify-between font-semibold text-[10px] uppercase tracking-widest shadow-md z-20 bg-[#F0F7FF] border-lightGray text-darkGray">
        <div className="flex items-center gap-2">
          <Layout size={14} className="text-primary" />
          <span className="text-primary tracking-tighter">Markdown Studio</span>
        </div>
        <div className="flex items-center gap-2 opacity-50">
          {isPaginating ? <FileText size={12} className="animate-pulse" /> : <Printer size={12} />}
          <span className="text-[9px] font-black uppercase">Standard A4</span>
        </div>
      </div>

      {/* Workspace Board (Dark Gray Background) */}
      <div className="flex-1 overflow-auto p-4 md:p-12 scrollbar-thin selection:bg-lightGray scroll-smooth bg-[#333333]">

        {/* HIDDEN MEASURER - Modified to ensure node visibility during measurement */}
        <div
          ref={measurerRef}
          className="prose-document absolute pointer-events-none z-[-1] opacity-0"
          style={{ width: `${measurerWidth}px`, top: '0', left: '0', color: colorStyle, visibility: 'visible' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
          >
            {markdown}
          </ReactMarkdown>
        </div>

        {/* EXPORT BUFFER (Capture Ready) */}
        <div
          id="export-buffer-root"
          className="fixed top-0 left-0 opacity-0 pointer-events-none z-[-100]"
          style={{ width: `${A4_WIDTH_PX}px` }}
        >
          {pages.map((pageEntries, pageIdx) => (
            <div
              key={`export-${pageIdx}`}
              className="export-page w-[794px] h-[1123px] bg-white prose-document"
              style={{ padding: `${marginPx}px`, color: colorStyle }}
            >
              <style>{`
                .export-page img {
                  .prose-document * {
                    max-width: 100%;
                    overflow-wrap: break-word !important;
                    text-wrap: pretty;
                  }

                  [align="center"] { text-align: center !important; }
                  [align="right"] { text-align: right !important; }
                  [align="left"] { text-align: left !important; }
                  object-fit: contain;
                  height: auto;
                  border-radius: 2px;
                  margin: 1.5em auto;
                  display: block;
                }
              `}</style>
              <div 
                className="flex-1 flex flex-col items-stretch overflow-visible relative page-content"
                style={{ outline: outlineStyle, outlineOffset: outlineOffset }}
              >
                {renderAtomicElements(pageEntries)}
              </div>

              <div className="absolute bottom-[1in] right-[1in] text-[9px] text-lightGray selection:bg-none pointer-events-none uppercase tracking-widest opacity-40">
                {pageIdx + 1} / {pages.length}
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATED PAGES (Preview) */}
        <div className="w-full flex-1 flex flex-col items-center pb-24">
          
          {/* Strict Dimension Wrapper to guarantee exact layout size without negative margin tricks */}
          <div 
            className="relative" 
            style={{ 
              width: `${A4_WIDTH_PX * scale}px`, 
              height: `${(pages.length > 0 ? (pages.length * 1123) + (pages.length * 48) : 1123) * scale}px` 
            }}
          >
            {/* Absolute Scaled Content - Never clips because it fits exactly inside the wrapper */}
            <div
              className="absolute top-0 left-0 origin-top-left transition-all duration-500 flex flex-col items-center"
              style={{ 
                transform: `scale(${scale})`, 
                width: `${A4_WIDTH_PX}px`
              }}
            >
              {pages.length > 0 ? (
                pages.map((pageEntries, pageIdx) => (
                <div
                  key={pageIdx}
                  className="document-page relative w-[794px] h-[1123px] bg-white shadow-2xl ring-1 ring-black/5 rounded-sm flex flex-col mb-12"
                  style={{ padding: `${marginPx}px`, color: colorStyle }}
                >
                  <div 
                    className="flex-1 flex flex-col items-stretch overflow-visible relative page-content prose-document"
                    style={{ outline: outlineStyle, outlineOffset: outlineOffset }}
                  >
                    {renderAtomicElements(pageEntries)}
                  </div>

                  <div className="absolute bottom-[0.5in] right-[0.5in] text-[9px] text-lightGray selection:bg-none pointer-events-none uppercase tracking-widest opacity-40">
                    {pageIdx + 1} / {pages.length}
                  </div>
                </div>
              ))
            ) : (
              <div className="w-[794px] h-[1123px] bg-white shadow-2xl flex items-center justify-center">
                <span className="text-mediumGray font-bold opacity-20 uppercase tracking-[0.3em]">No Content</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default Preview;
