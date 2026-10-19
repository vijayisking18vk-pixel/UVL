import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker for browser execution
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('PDF.js worker initialization warning:', err);
  }
}

export interface PDFInspectionResult {
  valid: boolean;
  totalPages: number;
  thumbnailDataUrl?: string;
  error?: string;
  pageDimensions?: { width: number; height: number }[];
}

/**
 * Validates file magic bytes to guarantee it is genuinely a PDF.
 */
export async function validatePDFHeader(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 5).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const header = String.fromCharCode(...bytes);
    return header.startsWith('%PDF-');
  } catch {
    return false;
  }
}

/**
 * Parses and inspects PDF metadata, total page count, and renders a clean thumbnail of Page 1.
 */
export async function inspectAndProcessPDF(file: File): Promise<PDFInspectionResult> {
  // 1. Content validation
  const isPdf = await validatePDFHeader(file);
  if (!isPdf) {
    return {
      valid: false,
      totalPages: 0,
      error: 'Invalid file format: File header does not match a valid PDF document.'
    };
  }

  // 2. Max file size check (50MB)
  const MAX_BYTES = 50 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return {
      valid: false,
      totalPages: 0,
      error: 'File exceeds 50MB limit. Please compress or optimize the PDF.'
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    const pageDimensions: { width: number; height: number }[] = [];
    let thumbnailDataUrl: string | undefined = undefined;

    // Render Page 1 to generate high-fidelity thumbnail
    if (totalPages > 0) {
      const page1 = await pdfDoc.getPage(1);
      const viewport = page1.getViewport({ scale: 0.5 });
      pageDimensions.push({ width: viewport.width, height: viewport.height });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        // Render page to canvas
        // @ts-ignore
        await page1.render(renderContext).promise;
        thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    return {
      valid: true,
      totalPages,
      thumbnailDataUrl,
      pageDimensions
    };
  } catch (err: any) {
    console.error('Failed to inspect PDF:', err);
    return {
      valid: false,
      totalPages: 0,
      error: err?.message || 'Failed to parse PDF document structure.'
    };
  }
}

/**
 * Loads a PDF document from an ArrayBuffer or URL string.
 */
export async function loadPDFDocument(source: ArrayBuffer | string) {
  if (typeof source === 'string') {
    return pdfjsLib.getDocument({ url: source }).promise;
  }
  return pdfjsLib.getDocument({ data: source }).promise;
}

/**
 * Renders a specific page onto an HTML Canvas element with proper devicePixelRatio scaling.
 */
export async function renderPDFPageToCanvas(
  pdfDoc: any,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.0
): Promise<{ width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * pixelRatio);
  canvas.height = Math.floor(viewport.height * pixelRatio);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return { width: viewport.width, height: viewport.height };
}
