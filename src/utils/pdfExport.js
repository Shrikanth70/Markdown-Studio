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

  try {
    for (let i = 0; i < pages.length; i++) {
      const pageElement = pages[i];
      
      // Full fidelity capture from the 1:1 hidden root
      const canvas = await html2canvas(pageElement, {
        scale: 2, 
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

          // Ensure all document content nodes follow the natural block flow
          const all = clonedDocument.querySelectorAll('.prose-document *');
          all.forEach(el => {
            el.style.overflow = 'visible';
            // Stop any inherited negative margins that could displace headers
            if (parseFloat(window.getComputedStyle(el).marginTop) < 0) {
              el.style.marginTop = '0';
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      if (i > 0) doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    }

    doc.save(finalFilename);
  } catch (error) {
    console.error('Error generating Paginated PDF:', error);
    alert('Failed to generate PDF. Check the browser console for more details.');
  }
};
