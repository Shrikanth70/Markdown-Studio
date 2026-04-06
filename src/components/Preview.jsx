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

  const marginPx = 96; // 2.54 cm = 1 inch = 96px at 96 DPI
  // STRICT equal margin (NO hacks, NO buffer)
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
      
      // Advanced height measurement to prevent clipping
      let childHeight = Math.max(
        el.offsetHeight || 0,
        el.scrollHeight || 0,
        el.getBoundingClientRect().height || 0
      );
      
      childHeight += (effectiveMarginT + marginB);

      // Cap only absurdly tall blocks (e.g. giant images) to the page limit
      if (childHeight > pageContentLimit) {
        childHeight = pageContentLimit;
      }

      const isHeading = ['h1', 'h2', 'h3', 'h4'].includes(Tag);

      // Refined Heading Glue Logic (60px)
      const wouldBeAlone = isHeading && (currentHeight + childHeight + 60 > pageContentLimit);

      // Account for parent container margins (e.g. table/list margins)
      if (entry.parentTag) {
        const parentEl = el.closest(entry.parentTag);
        if (parentEl) {
          const parentStyle = window.getComputedStyle(parentEl);
          if (entry.isFirstInParent) {
            childHeight += parseFloat(parentStyle.marginTop || 0);
          }
          if (entry.isLastInParent) {
            childHeight += parseFloat(parentStyle.marginBottom || 0);
          }
        }
      }

      // 10. Table Heading Glue (v4.0): 
      // If a table spans multiple pages, the header (thead) is repeated (see renderAtomicElements). 
      // We must account for this duplicated header height in our page boundary check.
      let extraHeightForHeader = 0;
      if (entry.parentTag === 'table' && !entry.isHeaderRow && entry.isFirstInParent === false && currentPage.length === 0) {
        const table = el.closest('table');
        const thead = table ? table.querySelector('thead') : null;
        if (thead) {
          // thead.offsetHeight handles the header height for the continuation page
          extraHeightForHeader = Math.max(thead.offsetHeight, 32); 
        }
      }

      // Atomic break check: including the extra header height if we're starting a table continuation page
      const maxAllowedHeight = pageContentLimit;

      if (
        currentHeight + childHeight + extraHeightForHeader > maxAllowedHeight &&
        currentPage.length > 0
      ) {
        newPages.push(currentPage);
        currentPage = [entry];
        currentHeight = childHeight + extraHeightForHeader;
      } else {
        currentPage.push(entry);
        currentHeight += (childHeight + extraHeightForHeader);
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

  const renderAtomicElements = (atomicEntries, isExport = false, keyPrefix = 'block') => {
    const rendered = [];
    let currentGroup = null;

    atomicEntries.forEach((entry, idx) => {
      const el = entry.element;
      const Tag = el.tagName.toLowerCase();
      const content = { __html: el.innerHTML };
      const className = el.className;
      // NUCLEAR KEY FIX: Combine prefix, global index, and tag to guarantee uniqueness across re-renders and pages
      const uniqueKey = `${keyPrefix}-at-${idx}-${Tag}`;

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
          
          // Track column count to optimize 2-column layouts later
          if (!currentGroup.columnCount && el.children) {
            currentGroup.columnCount = el.children.length;
          }

          target.push(
            <tr key={`${uniqueKey}-tr`} dangerouslySetInnerHTML={content} className={className} />
          );
        } else {
          currentGroup.items.push(
            <Tag key={uniqueKey} dangerouslySetInnerHTML={content} className={className} />
          );
        }
      } else {
        currentGroup = null;
        if (VOID_ELEMENTS.includes(Tag)) {
          rendered.push(<Tag key={uniqueKey} {...attributes} />);
        } else {
          rendered.push(<Tag key={uniqueKey} {...attributes} dangerouslySetInnerHTML={content} />);
        }
      }
    });

    return rendered.map((node, i) => {
      const outerKey = `${keyPrefix}-group-${i}`;
      if (node.tag) {
        const Container = node.tag;
        if (Container === 'table') {
          const colCount = node.columnCount || 0;
          return (
            <div
              key={`${outerKey}-table-wrap`}
              className={`table-fixed-wrap ${isExport ? "w-full my-6" : "w-full my-6 border border-lightGray/20 rounded-sm"}`}
              style={{
                width: "100%",
                maxWidth: "100%",
                overflow: "hidden",
                boxSizing: "border-box"
              }}
            >
              <table
                className="!my-0"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  tableLayout: "auto",
                  borderCollapse: "collapse"
                }}
              >
                {colCount === 2 && (
                  <colgroup>
                    <col style={{ width: "35%" }} />
                    <col style={{ width: "65%" }} />
                  </colgroup>
                )}
                {node.headers.length > 0 && <thead>{node.headers}</thead>}
                {node.bodies.length > 0 && <tbody>{node.bodies}</tbody>}
              </table>
            </div>
          );
        }
        return <Container key={`${outerKey}-${Container}-wrap`}>{node.items}</Container>;
      }
      return React.isValidElement(node) ? React.cloneElement(node, { key: outerKey }) : node;
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
              style={{
                padding: `${marginPx}px`,
                boxSizing: "border-box",
                color: colorStyle
              }}
            >
              <style>{`
                .export-page .prose-document *,
                .page-content * {
                  max-width: 100%;
                  box-sizing: border-box;
                }

                .export-page img,
                .page-content img {
                  max-width: 100% !important;
                  object-fit: contain;
                  height: auto;
                  border-radius: 2px;
                  margin: 1.5em auto;
                  display: block;
                }

                .export-page table,
                .page-content table {
                  width: 100% !important;
                  max-width: 100% !important;
                  table-layout: auto !important;
                  border-collapse: collapse !important;
                  margin: 1.5em 0 !important;
                }

                .export-page th,
                .export-page td,
                .page-content th,
                .page-content td {
                  white-space: normal !important;
                  word-break: normal !important;
                  overflow-wrap: break-word !important;
                  vertical-align: top !important;
                  padding: 12px 14px !important;
                  line-height: 1.5 !important;
                  border: 1px solid #E5E5E5 !important;
                  text-align: left !important;
                }

                .export-page th,
                .page-content th {
                  background: #F9F9F9 !important;
                  font-weight: 700 !important;
                }
                
                .export-page td,
                .page-content td {
                  hyphens: auto;
                }

                [align="center"] { text-align: center !important; }
                [align="right"] { text-align: right !important; }
                [align="left"] { text-align: left !important; }

                .page-content,
                .prose-document {
                  line-height: 1.6;
                }

                .page-content > *:first-child,
                .prose-document > *:first-child {
                  margin-top: 0 !important;
                  padding-top: 0 !important;
                }

                .table-fixed-wrap {
                  width: 100% !important;
                  max-width: 100% !important;
                  overflow: hidden !important;
                  box-sizing: border-box !important;
                }
              `}</style>
              <div 
                className="flex-1 flex flex-col items-stretch relative page-content"
                style={{
                  minHeight: `${pageContentLimit}px`,
                  maxHeight: 'none', // Allow natural overflow to prevent row skipping, clipped by .export-page overflow if needed
                  boxSizing: 'border-box',
                  outline: outlineStyle,
                  outlineOffset: outlineOffset
                }}
              >
                {renderAtomicElements(pageEntries, true, `export-page-${pageIdx}`)}
              </div>

              <div 
                className="absolute text-[9px] text-lightGray pointer-events-none uppercase tracking-widest opacity-40"
                style={{ bottom: `${marginPx}px`, right: `${marginPx}px` }}
              >
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
              <style>{`
                .page-content table {
                  width: 100% !important;
                  max-width: 100% !important;
                  table-layout: auto !important;
                  border-collapse: collapse !important;
                }

                .page-content th,
                .page-content td {
                  white-space: normal !important;
                  word-break: normal !important;
                  overflow-wrap: break-word !important;
                  vertical-align: top !important;
                  padding: 12px 14px !important;
                  line-height: 1.5 !important;
                }

                .page-content th {
                  font-weight: 700 !important;
                }

                .page-content td {
                  hyphens: auto;
                }

                .page-content .table-fixed-wrap {
                  width: 100% !important;
                  max-width: 100% !important;
                  overflow: hidden !important;
                  box-sizing: border-box !important;
                }
              `}</style>
              {pages.length > 0 ? (
                pages.map((pageEntries, pageIdx) => (
                <div
                  key={pageIdx}
                  className="document-page relative w-[794px] h-[1123px] bg-white shadow-2xl ring-1 ring-black/5 rounded-sm flex flex-col mb-12"
                  style={{
                    padding: `${marginPx}px`,
                    boxSizing: "border-box",
                    color: colorStyle
                  }}
                >
                  <div 
                    className="flex-1 flex flex-col items-stretch overflow-visible relative page-content prose-document"
                    style={{
                      minHeight: `${pageContentLimit}px`,
                      maxHeight: 'none', // Allow natural overflow to prevent row skipping
                      boxSizing: 'border-box',
                      outline: outlineStyle,
                      outlineOffset: outlineOffset
                    }}
                  >
                    {renderAtomicElements(pageEntries, false, `preview-page-${pageIdx}`)}
                  </div>

                  <div 
                    className="absolute text-[9px] text-lightGray pointer-events-none uppercase tracking-widest opacity-40"
                    style={{ bottom: `${marginPx}px`, right: `${marginPx}px` }}
                  >
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
