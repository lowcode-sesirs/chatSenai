import { useState } from 'react';

/**
 * Componente para renderizar conteúdo de mensagens da IA
 * Suporta: texto, links de vídeos e imagens da base de conhecimento
 */
function AIMessageContent({ message }) {
  const [imageErrors, setImageErrors] = useState({});

  const shouldRenderReferences = (messageText, references) => {
    if (!Array.isArray(references) || references.length === 0) return false;

    const raw = (messageText || '').trim().toLowerCase();
    if (!raw) return true;

    const normalized = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const genericPatterns = [
      /^ola\b/,
      /^oi\b/,
      /bem-vindo/,
      /em que posso ajudar/,
      /como posso ajudar/,
      /tudo bem/
    ];

    const isGenericGreeting = genericPatterns.some((pattern) => pattern.test(normalized));
    if (isGenericGreeting) return false;

    return true;
  };

  const renderTextWithVideoLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

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
      return part;
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
                <a href={img.url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={img.url}
                    alt={img.alt || 'Imagem do conteúdo'}
                    className="w-full h-auto cursor-pointer"
                    onError={() => setImageErrors((prev) => ({ ...prev, [index]: true }))}
                  />
                </a>
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
    if (!shouldRenderReferences(message?.text, references)) {
      return null;
    }

    if (references && Array.isArray(references) && references.length > 0) {
      return (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-[#E84910]">
          <p className="text-sm font-medium text-gray-700 mb-2">Fontes consultadas:</p>
          <div className="space-y-1">
            {references.map((ref, index) => (
              <div key={index} className="text-xs text-gray-600">
                Fonte: {ref.source || ref.title || ref}
                {ref.page && `, paginas: ${ref.page}`}
                {ref.chapter && `, ${ref.chapter}`}
                {ref.link && (
                  <div className="mt-1">
                    <a
                      href={ref.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E84910] hover:underline"
                    >
                      {ref.source || ref.title || 'Abrir apostila'}
                    </a>
                  </div>
                )}
              </div>
            ))}
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
    </div>
  );
}

export default AIMessageContent;

