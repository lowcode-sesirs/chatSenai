import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { buildPdfContentUrl, fetchViewToken } from '../services/pdfService';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

function PdfViewerPage() {
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id: routeId } = useParams();

  const contentSourceId = useMemo(() => {
    if (routeId) return routeId;
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    return pathParts[pathParts.length - 1];
  }, [routeId]);
  const targetPage = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const value = Number(params.get('page') || 1);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  }, []);
  const viewTokenFromHash = useMemo(() => {
    const hash = window.location.hash?.replace(/^#/, '');
    if (!hash) return null;
    const params = new URLSearchParams(hash);
    return params.get('token');
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousRootOverflow = root?.style.overflow ?? '';

    html.style.overflow = 'auto';
    body.style.overflow = 'auto';
    if (root) root.style.overflow = 'auto';

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      if (root) root.style.overflow = previousRootOverflow;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      setLoading(true);
      setError('');
      try {
        const viewToken = viewTokenFromHash || await fetchViewToken(contentSourceId);
        const pdfUrl = buildPdfContentUrl(contentSourceId);

        const doc = await pdfjsLib.getDocument({
          url: pdfUrl,
          httpHeaders: {
            Authorization: `Bearer ${viewToken}`,
          },
        }).promise;

        if (cancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        const safePage = Math.min(targetPage, doc.numPages);
        setPageNumber(safePage);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Erro ao carregar PDF');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [contentSourceId, targetPage, viewTokenFromHash]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;

    const renderCurrentPage = async () => {
      const page = await pdfDoc.getPage(pageNumber);
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 1.3 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
    };

    renderCurrentPage().catch(() => {
      if (!cancelled) setError('Erro ao renderizar página do PDF');
    });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  const handlePrevious = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setPageNumber((prev) => Math.min(prev + 1, numPages));

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 overflow-y-auto">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={!pdfDoc || pageNumber <= 1}
            className="rounded bg-[#262626] px-3 py-2 text-sm text-white disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!pdfDoc || pageNumber >= numPages}
            className="rounded bg-[#262626] px-3 py-2 text-sm text-white disabled:opacity-40"
          >
            Próxima
          </button>
          <span className="ml-2 text-sm text-gray-700">
            Página {pageNumber} de {numPages || '-'}
          </span>
        </div>

        {loading ? <div className="text-sm text-gray-700">Carregando PDF...</div> : null}
        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="overflow-auto rounded border border-gray-200 bg-white p-2">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}

export default PdfViewerPage;
