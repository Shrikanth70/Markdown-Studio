import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Rebuilt PDF Export Engine - True Paginated A4.
 * Instead of taking a single DOM snapshot, this engine iterates through discrete document-page 
 * components and renders each as a unique PDF sheet to ensure document-identical pagination.
 * 
 * @param {string} filename - The name of the resulting PDF file.
 */
export const exportToPdf = async (filename = 'markdown-studio-export.pdf') => {
  // Target the high-fidelity, untransformed 1:1 export pages
  const pages = document.querySelectorAll('.export-page');
  
  if (!pages || pages.length === 0) {
    console.warn(`Export buffer is empty. Wait for document to render or add some content.`);
    return;
  }

  const finalFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15; // Strict margins for visual balance
  const usableWidth = pageWidth - 2 * margin;
  const usableHeight = pageHeight - 2 * margin;

  try {
    for (let i = 0; i < pages.length; i++) {
      const pageElement = pages[i];
      
      // Full fidelity capture from the 1:1 hidden root
      const canvas = await html2canvas(pageElement, {
        scale: 2.2, // Boosted slightly for even sharper text
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        onclone: (clonedDocument) => {
          // Force the hidden export buffer to be fully 'awake' for the capture session
          const root = clonedDocument.getElementById('export-buffer-root');
          if (root) {
            root.style.opacity = '1';
            root.style.visibility = 'visible';
            root.style.display = 'block';
            root.style.position = 'relative'; 
            root.style.left = '0';
            root.style.top = '0';
          }

          // === FIX: sanitize unsupported color functions (oklab, oklch, etc.) ===
          const sanitizeNodeForHtml2Canvas = (rootNode) => {
            const unsupportedRegex = /oklab|oklch|color-mix|color\(/i;
            const elements = [rootNode, ...rootNode.querySelectorAll('*')];
            
            // Reusable conversion canvas to avoid overhead
            const colorCanvas = clonedDocument.createElement('canvas');
            colorCanvas.width = colorCanvas.height = 1;
            const colorCtx = colorCanvas.getContext('2d', { WILL_READ_FREQUENTLY: true });

            const toSafeColor = (value) => {
              if (!value || typeof value !== 'string' || !unsupportedRegex.test(value)) return value;
              const colorFuncRegex = /(oklch|oklab|color-mix|color)\(.*?\)($|,|\s)/g;
              return value.replace(colorFuncRegex, (match) => {
                const colorPart = match.trim().replace(/,$/, '');
                const separator = match.endsWith(',') ? ',' : (match.endsWith(' ') ? ' ' : '');
                try {
                  colorCtx.clearRect(0, 0, 1, 1);
                  colorCtx.fillStyle = colorPart;
                  colorCtx.fillRect(0, 0, 1, 1);
                  const [r, g, b, a] = colorCtx.getImageData(0, 0, 1, 1).data;
                  const safe = a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
                  return safe + separator;
                } catch (e) {
                  return match; 
                }
              });
            };

            const propertiesToFix = [
              'color', 'backgroundColor', 'borderColor', 'outlineColor', 
              'fill', 'stroke', 'boxShadow', 'textDecorationColor'
            ];

            elements.forEach(el => {
              const style = window.getComputedStyle(el);
              propertiesToFix.forEach(prop => {
                const val = style[prop];
                if (val && unsupportedRegex.test(val)) {
                  el.style[prop] = toSafeColor(val);
                }
              });
            });
          };

          sanitizeNodeForHtml2Canvas(clonedDocument.body);

          // EXPORT HARDENING: Strip artifacts and stabilize layout
          const all = clonedDocument.querySelectorAll('.export-page, .export-page *');
          all.forEach(el => {
            el.style.boxShadow = 'none';
            el.style.textShadow = 'none';
            el.style.transition = 'none';
            el.style.animation = 'none';
            
            // CRITICAL: Prevent .export-page from becoming overflow:visible,
            // which causes html2canvas to capture spilled content and stretch the image.
            if (el.classList.contains('export-page')) {
              el.style.overflow = 'hidden';
              el.style.height = '1123px';
              el.style.maxHeight = '1123px';
              el.style.boxSizing = 'border-box';
              el.style.padding = '57px'; // Strict 15mm padding
            } else {
              el.style.overflow = 'visible';
            }
            
            const style = window.getComputedStyle(el);
            if (parseFloat(style.marginTop) < 0) {
              el.style.marginTop = '0';
            }

            if (el.tagName.toLowerCase() === 'table') {
              el.style.display = 'table';
              el.style.width = '100%';
              el.style.borderCollapse = 'collapse';
              el.style.tableLayout = 'fixed'; // Stabilize cell widths
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // STRICT 1:1 A4 MAPPING:
      // Since .export-page is locked to 794x1123 and overflow:hidden, 
      // adding it at 0,0 to the A4 page results in perfect 15mm margins (from the internal padding).
      if (i > 0) doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    }

    doc.save(finalFilename);
  } catch (error) {
    console.error('Error generating Paginated PDF:', error);
    alert('Failed to generate PDF. Check the browser console for more details.');
  }
};
