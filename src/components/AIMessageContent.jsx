import { useState } from 'react';

const USE_INTERNAL_PDF_VIEWER =
  String(import.meta.env.VITE_USE_INTERNAL_PDF_VIEWER || 'false').toLowerCase() === 'true';

/**
 * Componente para renderizar conteúdo de mensagens da IA
 * Suporta: texto, links de vídeos e imagens da base de conhecimento
 */
function AIMessageContent({ message }) {
  const [imageErrors, setImageErrors] = useState({});
  const [lightboxImage, setLightboxImage] = useState(null);

  const isEmbeddedIframe = () =>
    typeof window !== 'undefined' && window.parent && window.parent !== window;

  const handleOpenImage = (img) => {
    if (!img?.url) return;

    if (isEmbeddedIframe()) {
      try {
        window.parent.postMessage(
          {
            type: 'CHAT_IMAGE_LIGHTBOX_OPEN',
            image: {
              url: img.url,
              alt: img.alt || 'Imagem do conteúdo',
              title: img.alt || 'Imagem do conteúdo',
            }
          },
          '*'
        );
        return;
      } catch (error) {
        console.warn('Falha ao solicitar lightbox de imagem ao parent:', error);
      }
    }

    setLightboxImage({
      url: img.url,
      alt: img.alt || 'Imagem do conteúdo'
    });
  };

  const getPdfViewerUrl = (reference) => {
    const contentSourceId = reference?.contentSourceId || reference?.id;
    if (!contentSourceId) return null;
    const page = Number(reference?.targetPage || 1);
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    return `/pdf/${contentSourceId}?page=${safePage}`;
  };

  const getDirectReferenceUrl = (reference) => {
    const normalizeCandidate = (value) => {
      if (!value || typeof value !== 'string') return null;

      const cleanedValue = value
        .trim()
        .replace(/^"+|"+$/g, '')
        .replace(/^%22|%22$/gi, '');

      if (/^https?:\/\//i.test(cleanedValue)) {
        return cleanedValue;
      }

      return null;
    };

    const explicitCandidates = [
      reference?.Link,
      reference?.link,
      reference?.url,
      reference?.external_url,
      reference?.externalUrl,
    ]
      .map(normalizeCandidate)
      .filter(Boolean);

    const preferredExplicitCandidate = explicitCandidates.find((value) =>
      value.includes('drive.google.com')
    );

    if (preferredExplicitCandidate) {
      return preferredExplicitCandidate;
    }

    if (explicitCandidates.length > 0) {
      return explicitCandidates[0];
    }

    if (reference && typeof reference === 'object') {
      const discoveredCandidates = Object.values(reference)
        .map(normalizeCandidate)
        .filter(Boolean);

      const preferredDiscoveredCandidate = discoveredCandidates.find((value) =>
        value.includes('drive.google.com')
      );

      if (preferredDiscoveredCandidate) {
        return preferredDiscoveredCandidate;
      }

      if (discoveredCandidates.length > 0) {
        return discoveredCandidates[0];
      }
    }

    return null;
  };

  const getReferenceHref = (reference) => {
    const directLink = getDirectReferenceUrl(reference);
    const viewerUrl = getPdfViewerUrl(reference);

    if (USE_INTERNAL_PDF_VIEWER) {
      return viewerUrl;
    }

    return directLink;
  };

  const handleOpenReference = (event, reference) => {
    const directLink = getDirectReferenceUrl(reference);
    const href = getReferenceHref(reference);
    if (!href) return;

    if (!USE_INTERNAL_PDF_VIEWER && directLink) {
      event.preventDefault();
      window.open(directLink, '_blank', 'noopener,noreferrer');
    }
  };

  const renderBoldSegments = (text, keyPrefix) => {
    const ESCAPED_ASTERISK_TOKEN = '__ESCAPED_ASTERISK__';
    const safeText = text.replace(/\\\*/g, ESCAPED_ASTERISK_TOKEN);
    const boldRegex = /(\*\*([\s\S]+?)\*\*|\*([\s\S]+?)\*)/g;
    const chunks = [];
    let lastIndex = 0;
    let match;
    let chunkIndex = 0;

    while ((match = boldRegex.exec(safeText)) !== null) {
      if (match.index > lastIndex) {
        chunks.push(
          safeText.slice(lastIndex, match.index).replaceAll(ESCAPED_ASTERISK_TOKEN, '*')
        );
      }

      const boldText = (match[2] || match[3] || '')
        .replaceAll(ESCAPED_ASTERISK_TOKEN, '*')
        .trim();

      if (boldText) {
        chunks.push(
          <strong key={`${keyPrefix}-bold-${chunkIndex}`} className="font-semibold">
            {boldText}
          </strong>
        );
      } else {
        chunks.push(match[0].replaceAll(ESCAPED_ASTERISK_TOKEN, '*'));
      }

      lastIndex = boldRegex.lastIndex;
      chunkIndex += 1;
    }

    if (lastIndex < safeText.length) {
      chunks.push(safeText.slice(lastIndex).replaceAll(ESCAPED_ASTERISK_TOKEN, '*'));
    }

    return chunks.length > 0 ? chunks : [text];
  };

  const renderTextWithVideoLinks = (text) => {
    const normalizedText = text.replace(/^\s*[*-]\s+/gm, '');
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = normalizedText.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E84910] hover:underline font-medium"
          >
            Assistir vídeo
          </a>
        );
      }
      return renderBoldSegments(part, `text-${index}`);
    });
  };

  const renderImages = (media) => {
    if (!media || !Array.isArray(media)) return null;

    const images = media.filter((item) => item.type === 'image');
    if (images.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium text-gray-700">Imagens relacionadas:</p>
        <div className="flex flex-col md:flex-row md:flex-wrap gap-3">
          {images.map((img, index) => (
            <div key={index} className="rounded-lg overflow-hidden border border-gray-200 w-full md:w-[200px]">
              {!imageErrors[index] ? (
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => handleOpenImage(img)}
                  title="Abrir imagem"
                  aria-label="Abrir imagem"
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  <img
                    src={img.url}
                    alt={img.alt || 'Imagem do conteúdo'}
                    className="w-full h-auto cursor-pointer"
                    onError={() => setImageErrors((prev) => ({ ...prev, [index]: true }))}
                  />
                </button>
              ) : (
                <div className="bg-gray-100 p-4 text-center text-gray-500 text-sm">
                  Imagem não disponível
                </div>
              )}
              {img.alt && <p className="text-xs text-gray-500 p-2 bg-gray-50">{img.alt}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVideoLinks = (media) => {
    if (!media || !Array.isArray(media)) return null;

    const videos = media.filter((item) => item.type === 'video');
    if (videos.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium text-gray-700">Vídeos relacionados:</p>
        {videos.map((video, index) => (
          <a
            key={index}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-[#F6FBFF] rounded-lg hover:bg-[#E4ECF5] transition-colors"
          >
            <div className="text-[#E84910] font-medium text-sm mb-1">
              {video.title || 'Assistir vídeo'}
            </div>
            {video.source && <div className="text-xs text-gray-500">Fonte: {video.source}</div>}
          </a>
        ))}
      </div>
    );
  };

  const renderReferences = (references) => {
    if (references && Array.isArray(references) && references.length > 0) {
      return (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-[#E84910]">
          <p className="text-sm font-medium text-gray-700 mb-2">Fontes consultadas:</p>
          <div className="space-y-1">
            {references.map((ref, index) => {
              const referenceHref = getReferenceHref(ref);
              const referenceLabel = ref.source || ref.title || 'Abrir apostila';

              return (
                <div key={index} className="text-xs text-gray-600">
                  Fonte:{' '}
                  {referenceHref ? (
                    <a
                      href={referenceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => handleOpenReference(event, ref)}
                      className="text-[#E84910] hover:underline"
                    >
                      {referenceLabel}
                    </a>
                  ) : (
                    <span>{referenceLabel}</span>
                  )}
                  {ref.page && `, paginas: ${ref.page}`}
                  {ref.chapter && `, ${ref.chapter}`}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (!message.out_of_scope && !message.isWelcome && message.type === 'ai') {
      return (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
          <p className="text-sm font-medium text-yellow-700 mb-1">Atenção:</p>
          <p className="text-xs text-yellow-600">
            Esta resposta deveria incluir referências às fontes consultadas (apostilas, livros, vídeos).
            Recomendamos verificar o material oficial do curso para confirmar as informações.
          </p>
        </div>
      );
    }

    return null;
  };

  const renderSuggestedTopics = (suggestedTopics) => {
    if (!suggestedTopics || !Array.isArray(suggestedTopics) || suggestedTopics.length === 0) return null;

    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
        <p className="text-sm font-medium text-blue-700 mb-2">Tópicos que posso ajudar:</p>
        <div className="space-y-1">
          {suggestedTopics.map((topic, index) => (
            <div key={index} className="text-xs text-blue-600">
              • {topic}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
        {renderTextWithVideoLinks(message.text)}
        {message.isStreaming && <span className="inline-block w-2 h-4 bg-gray-700 ml-1 animate-pulse"></span>}
      </div>

      {message.media && renderVideoLinks(message.media)}
      {message.media && renderImages(message.media)}
      {message.references && renderReferences(message.references)}
      {message.suggested_topics && renderSuggestedTopics(message.suggested_topics)}

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700 truncate">
                {lightboxImage.alt || 'Imagem'}
              </span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="text-sm px-3 py-1 rounded hover:bg-gray-100"
                title="Fechar"
              >
                Fechar
              </button>
            </div>
            <div className="p-3 max-h-[calc(90vh-56px)] overflow-auto flex items-center justify-center">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.alt || 'Imagem'}
                className="max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIMessageContent;
