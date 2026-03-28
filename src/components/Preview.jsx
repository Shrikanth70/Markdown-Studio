import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { Layout, FileText, Printer, CheckCircle } from 'lucide-react';

const A4_HEIGHT_PX = 1123; // at 96 DPI
const A4_WIDTH_PX = 794;
const TOP_MARGIN_PX = 96; // 2.54 cm / 1 inch
const BOTTOM_MARGIN_PX = 96; // 2.54 cm / 1 inch
// Exact 1-inch content framing - rely entirely on CSS padding
const PAGE_CONTENT_LIMIT = 931;

const VOID_ELEMENTS = ['hr', 'img', 'br', 'area', 'base', 'col', 'embed', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

const Preview = ({ markdown }) => {
  const [pages, setPages] = useState([]);
  const [isPaginating, setIsPaginating] = useState(false);
  const measurerRef = useRef(null);

  // Pagination Engine Logic
  useEffect(() => {
    if (!markdown) {
      setPages([]);
      return;
    }

    const paginate = () => {
      setIsPaginating(true);
      const parent = measurerRef.current;
      const children = parent.children;
      if (!children || children.length === 0) {
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
        const style = window.getComputedStyle(el);
        const marginT = parseFloat(style.marginTop || 0);
        const marginB = parseFloat(style.marginBottom || 0);

        // Precise Top Alignment (v3.2): Reset margin-top for the first element on each page
        const effectiveMarginT = currentHeight === 0 ? 0 : marginT;
        let childHeight = el.offsetHeight + effectiveMarginT + marginB;

        const Tag = el.tagName.toLowerCase();
        const isHeading = ['h1', 'h2', 'h3', 'h4'].includes(Tag);

        // Refined Heading Glue Logic (60px)
        const wouldBeAlone = isHeading && (currentHeight + childHeight + 60 > PAGE_CONTENT_LIMIT);

        // Add container margins only for the first item of a split group
        if (entry.parentTag && entry.isFirstInParent) {
          const parentEl = el.closest(entry.parentTag);
          if (parentEl) {
            const parentStyle = window.getComputedStyle(parentEl);
            childHeight += parseFloat(parentStyle.marginTop || 0);
          }
        }

        // Atomic break check
        if ((currentHeight + childHeight > PAGE_CONTENT_LIMIT || wouldBeAlone) && currentPage.length > 0) {
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

    const timer = setTimeout(paginate, 200);
    return () => clearTimeout(timer);
  }, [markdown]);

  const renderAtomicElements = (atomicEntries) => {
    const rendered = [];
    let currentGroup = null;

    atomicEntries.forEach((entry, idx) => {
      const el = entry.element;
      const Tag = el.tagName.toLowerCase();
      const content = { __html: el.innerHTML };
      const className = el.className;

      if (entry.parentTag) {
        const ParentTag = entry.parentTag;
        if (!currentGroup || currentGroup.tag !== ParentTag) {
          currentGroup = { tag: ParentTag, items: [] };
          rendered.push(currentGroup);
        }

        if (ParentTag === 'table') {
          currentGroup.items.push(
            <tr key={idx} dangerouslySetInnerHTML={content} className={className} />
          );
        } else {
          currentGroup.items.push(
            <Tag key={idx} dangerouslySetInnerHTML={content} className={className} />
          );
        }
      } else {
        currentGroup = null;
        if (VOID_ELEMENTS.includes(Tag)) {
          rendered.push(<Tag key={idx} className={className} />);
        } else {
          rendered.push(<Tag key={idx} dangerouslySetInnerHTML={content} className={className} />);
        }
      }
    });

    return rendered.map((node, i) => {
      if (node.tag) {
        const Container = node.tag;
        if (Container === 'table') {
          return (
            <table key={i}>
              <tbody>{node.items}</tbody>
            </table>
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
          <span className="text-[9px] font-black uppercase">Standard A4 • 1" Symmetrical</span>
        </div>
      </div>

      {/* Workspace Board (Dark Gray Background) */}
      <div className="flex-1 overflow-auto p-4 md:p-12 scrollbar-thin selection:bg-lightGray scroll-smooth bg-[#333333]">

        {/* HIDDEN MEASURER - Modified to ensure node visibility during measurement */}
        <div
          ref={measurerRef}
          className="prose-document invisible absolute pointer-events-none z-[-1]"
          style={{ width: `602px`, top: '0', left: '0' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
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
              className="export-page w-[794px] h-[1123px] bg-white prose-document flex flex-col relative"
            >
              <div className="flex-1 flex flex-col items-stretch text-left overflow-visible relative page-content">
                {renderAtomicElements(pageEntries)}
              </div>

              <div className="absolute bottom-[1in] right-[1in] text-[9px] text-lightGray selection:bg-none pointer-events-none uppercase tracking-widest opacity-40">
                {pageIdx + 1} / {pages.length}
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATED PAGES (Preview) */}
        <div className="w-full h-full flex flex-col items-center">
          <div
            className="origin-top transition-transform duration-500 pb-[400px]"
            style={{ transform: 'scale(0.62)', width: `${A4_WIDTH_PX}px` }}
          >
            {pages.length > 0 ? (
              pages.map((pageEntries, pageIdx) => (
                <div
                  key={pageIdx}
                  className="document-page relative w-[794px] h-[1123px] bg-white shadow-2xl prose-document overflow-hidden ring-1 ring-black/5 rounded-sm flex flex-col mb-12"
                >
                  <div className="flex-1 flex flex-col items-stretch text-left overflow-visible relative page-content">
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
  );
};

export default Preview;
