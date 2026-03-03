import { X, Trash2, RefreshCw } from 'lucide-react';

/**
 * Gera título no formato "Chat DD/MM/AAAA" baseado na data da conversa
 */
const generateDisplayTitle = (chat) => {
  const titleCandidates = [
    chat?.chat_title,
    chat?.session_title,
    chat?.title,
    chat?.name,
  ];

  const cleanTitle = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim();
  };

  const isPlaceholderTitle = (value) => {
    if (!value) return true;

    const normalized = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized === 'chat sem titulo') return true;
    if (/^chat\s+\d{2}\/\d{2}\/\d{4}$/i.test(value.trim())) return true;

    return false;
  };

  const preferredTitle = titleCandidates
    .map(cleanTitle)
    .find((value) => value && !isPlaceholderTitle(value));

  if (preferredTitle) {
    return preferredTitle;
  }

  return 'Chat sem titulo';
};

/**
 * Componente de sidebar para exibir histórico de conversas
 */
function HistorySidebar({ isOpen, onClose, history, onSelectChat, isLoading, onRefresh, onDeleteChat, canDeleteChat = false }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed right-0 h-full w-full md:w-96 bg-white shadow-2xl z-30 transform transition-transform duration-300 ease-in-out"
      style={{ 
        top: '60px', // Abaixo do cabeçalho
        height: 'calc(100vh - 60px)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Histórico de conversas</h2>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button 
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Recarregar histórico"
            >
              <RefreshCw size={18} className={`text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div 
        className="overflow-y-auto h-[calc(100%-64px)]"
        style={{ backgroundColor: '#FFFBF6' }}
      >
          {isLoading ? (
            // Estado de carregamento
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E84910] mb-3"></div>
                <p className="text-sm text-gray-500">Carregando histórico...</p>
              </div>
            </div>
          ) : history && history.length > 0 ? (
            <div className="p-4">
              {/* Agrupamento por data */}
              {Object.entries(groupByDate(history)).map(([dateLabel, chats]) => (
                <div key={dateLabel} className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <h3 className="text-xs font-medium text-gray-400 uppercase whitespace-nowrap">
                      {dateLabel}
                    </h3>
                    
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>
                  <div className="space-y-2">
                    {chats.map((chat, index) => (
                      <div
                        key={chat.id || chat.session_id || index}
                        onClick={() => onSelectChat && onSelectChat(chat)}
                        className="p-4 bg-white rounded-lg cursor-pointer transition-shadow hover:shadow-md"
                        style={{ 
                          border: '1px solid #E5E5E5',
                          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 flex-1">
                            {generateDisplayTitle(chat)}
                          </h4>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatTime(chat.timestamp || chat.updated_at || chat.created_at || chat.date)}
                            </span>
                            {canDeleteChat && (
                              <button 
                                className="transition-opacity flex-shrink-0 hover:opacity-70"
                                title="Excluir conversa"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onDeleteChat) {
                                    onDeleteChat(chat);
                                  }
                                }}
                              >
                                <Trash2 size={14} className="text-[#FF0000]" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {chat.preview || chat.last_message || chat.message || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dol...'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Estado vazio
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-300"></div>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  HOJE
                </h3>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>
              <p className="text-center text-sm text-gray-500">
                Você ainda não iniciou nenhuma conversa.
              </p>
            </div>
          )}
        </div>
      </div>
  );
}

// Função auxiliar para agrupar conversas por data
function groupByDate(history) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const groups = {};

  history.forEach((chat) => {
    const chatDate = new Date(chat.timestamp || chat.updated_at || chat.created_at || chat.date);
    const chatDay = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());
    
    const diffTime = today - chatDay;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let label;
    
    if (diffDays === 0) {
      label = 'HOJE';
    } else if (diffDays === 1) {
      label = 'ONTEM';
    } else if (diffDays >= 2 && diffDays <= 6) {
      label = `HÁ ${diffDays} DIAS`;
    } else if (diffDays >= 7 && diffDays < 14) {
      label = 'HÁ 1 SEMANA';
    } else if (diffDays >= 14 && diffDays < 21) {
      label = 'HÁ 2 SEMANAS';
    } else if (diffDays >= 21 && diffDays < 28) {
      label = 'HÁ 3 SEMANAS';
    } else if (diffDays >= 28 && diffDays < 60) {
      const weeks = Math.floor(diffDays / 7);
      label = `HÁ ${weeks} SEMANAS`;
    } else if (diffDays >= 60 && diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      label = months === 1 ? 'HÁ 1 MÊS' : `HÁ ${months} MESES`;
    } else {
      const years = Math.floor(diffDays / 365);
      label = years === 1 ? 'HÁ 1 ANO' : `HÁ ${years} ANOS`;
    }
    
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(chat);
  });

  // Retorna grupos na ordem correta
  const orderedLabels = [
    'HOJE', 'ONTEM',
    ...Object.keys(groups).filter(k => k.startsWith('HÁ') && k.includes('DIAS')).sort((a, b) => {
      const daysA = parseInt(a.match(/\d+/)[0]);
      const daysB = parseInt(b.match(/\d+/)[0]);
      return daysA - daysB;
    }),
    ...Object.keys(groups).filter(k => k.includes('SEMANA')).sort((a, b) => {
      const weeksA = a.includes('1 SEMANA') ? 1 : parseInt(a.match(/\d+/)[0]);
      const weeksB = b.includes('1 SEMANA') ? 1 : parseInt(b.match(/\d+/)[0]);
      return weeksA - weeksB;
    }),
    ...Object.keys(groups).filter(k => k.includes('MÊS') || k.includes('MESES')).sort((a, b) => {
      const monthsA = a.includes('1 MÊS') ? 1 : parseInt(a.match(/\d+/)[0]);
      const monthsB = b.includes('1 MÊS') ? 1 : parseInt(b.match(/\d+/)[0]);
      return monthsA - monthsB;
    }),
    ...Object.keys(groups).filter(k => k.includes('ANO')).sort((a, b) => {
      const yearsA = a.includes('1 ANO') ? 1 : parseInt(a.match(/\d+/)[0]);
      const yearsB = b.includes('1 ANO') ? 1 : parseInt(b.match(/\d+/)[0]);
      return yearsA - yearsB;
    })
  ];

  const orderedGroups = {};
  orderedLabels.forEach(label => {
    if (groups[label]) {
      orderedGroups[label] = groups[label];
    }
  });

  return orderedGroups;
}

// Função auxiliar para formatar hora
function formatTime(timestamp) {
  if (!timestamp) return '03.11';
  
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}

export default HistorySidebar;


