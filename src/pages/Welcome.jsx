import { useState, useEffect, useRef } from 'react';
import { Pencil, User, Square } from 'lucide-react';
import { startChat, sendChatMessage, getChatStream, sendFeedback, getChatHistory, loadChat, renameChat, saveChat, deleteChat } from '../services/chatService';
import { getMoodleUser } from '../services/moodleAuthService';
import AIMessageContent from '../components/AIMessageContent';
import HistorySidebar from '../components/HistorySidebar';
import historicoIcon from '../assets/historico.png';
import questionIcon from '../assets/question.png';
import fiergsSenaiLogo from '../assets/senai.png';
import vectorLogo from '../assets/historicoCard.png';
import ultimasConversas from '../assets/Vector.png';
import likeIcon from '../assets/like.png';
import dislikeIcon from '../assets/thumb_down_alt.png';
import sendIcon from '../assets/Send.solid.png';
import copiarIcon from '../assets/copiar.png';
import novaConversaIcon from '../assets/novaConversa.png';

function Welcome() {
  const [message, setMessage] = useState('');
  const [moodleUser, setMoodleUser] = useState(() => getMoodleUser());
  const now = new Date();
  const [chatTitle, setChatTitle] = useState(`Chat ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTitleRename, setPendingTitleRename] = useState(false);
  // Função para gerar UUID v4 válido
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const [sessionId, setSessionId] = useState(generateUUID()); // ID único da sessão (UUID)
  const [currentChatId, setCurrentChatId] = useState(null); // ID do chat atual (se carregado do histórico)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: 'Olá! Eu sou a SEN.AI, sua parceira de estudo.',
      isWelcome: true,
      timestamp: new Date(),
      messageId: 'welcome-msg'
    }
  ]);
  const [feedbackGiven, setFeedbackGiven] = useState({}); // Rastreia feedback dado por messageId
  const [copiedMessages, setCopiedMessages] = useState({}); // Rastreia mensagens copiadas
  // deletados são tratados pelo backend
  const messagesEndRef = useRef(null);

  // Scroll automático para o final quando novas mensagens chegam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const updateMoodleUser = () => {
      setMoodleUser(getMoodleUser());
    };
    updateMoodleUser();
    window.addEventListener('moodle_user_updated', updateMoodleUser);
    let attempts = 0;
    const retryLoad = () => {
      const latest = getMoodleUser();
      if (latest && (latest.userName || latest.userId || latest.userEmail)) {
        setMoodleUser(latest);
        return;
      }
      attempts += 1;
      if (attempts < 6) {
        setTimeout(retryLoad, 500);
      }
    };
    retryLoad();
    return () => {
      window.removeEventListener('moodle_user_updated', updateMoodleUser);
    };
  }, []);

  const getDisplayUserName = (user) => {
    const name =
      user?.userName ||
      user?.fullname ||
      user?.user_name ||
      user?.username ||
      user?.name ||
      (typeof window !== 'undefined' && window.__MOODLE_USER__ &&
        (window.__MOODLE_USER__.userName ||
          window.__MOODLE_USER__.fullname ||
          window.__MOODLE_USER__.user_name ||
          window.__MOODLE_USER__.username ||
          window.__MOODLE_USER__.name));
    if (typeof name === 'string' && name.trim()) return name.trim();
    if (name) return String(name);
    return 'Aluno';
  };

  const matchChatToUser = (chat, user) => {
    if (!chat || !user) return false;
    const userId = user.userId ?? user.id ?? null;
    const userEmail = user.userEmail ?? user.email ?? null;
    const userName = user.userName ?? user.fullname ?? user.username ?? null;

    const chatFields = [
      chat.user_id,
      chat.userId,
      chat.user,
      chat.user_email,
      chat.userEmail,
      chat.email,
      chat.user_name,
      chat.userName,
      chat.username,
      chat.x_dev_user,
      chat.xDevUser,
      chat.dev_user,
      chat.devUser,
      chat.owner_id,
      chat.ownerId,
      chat.created_by,
      chat.createdBy
    ].filter((value) => value !== undefined && value !== null);

    if (chatFields.length === 0) return false;

    return chatFields.some((value) => {
      if (userId !== null && String(value) === String(userId)) return true;
      if (userEmail && String(value).toLowerCase() === String(userEmail).toLowerCase()) return true;
      if (userName && String(value).toLowerCase() === String(userName).toLowerCase()) return true;
      return false;
    });
  };


  // Função para carregar histórico (lazy loading)
  const loadHistory = async (forceReload = false) => {
    // Se já carregou e não é reload forçado, não recarrega
    if (historyLoaded && !forceReload) return;
    
    setIsLoadingHistory(true);
    try {
      console.log('🔄 Carregando histórico de conversas...');
      const history = await getChatHistory();
      
      // Verifica se recebeu dados válidos
      if (Array.isArray(history)) {
        console.log('📚 Histórico carregado da API:', history.length, 'conversas');
        
        // Debug: Verificar estrutura de cada chat (apenas se tiver dados)
        if (history.length > 0) {
          console.log('🔍 Estrutura do primeiro chat:', history[0]);
          console.log('🔍 Campos disponíveis:', Object.keys(history[0]));
        }
        
        const filteredHistory = history;
        
        const sortedHistory = filteredHistory.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at || 0);
          const dateB = new Date(b.updated_at || b.created_at || 0);
          return dateB - dateA;
        });
        
        setChatHistory(sortedHistory);
        setHistoryLoaded(true);
        console.log('✅ Histórico carregado e ordenado com sucesso!');
      } else {
        console.log('⚠️ Histórico retornado não é um array, usando array vazio');
        setChatHistory([]);
        setHistoryLoaded(true);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error.message);
      
      // Define histórico vazio em caso de erro
      setChatHistory([]);
      
      // Marca como carregado mesmo com erro para evitar loops infinitos
      setHistoryLoaded(true);
      
      // Log adicional para debug
      console.log('🔄 Histórico definido como vazio devido ao erro');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Função para recarregar histórico manualmente
  const handleRefreshHistory = () => {
    loadHistory(true);
  };

  // Função para limpar lista de chats deletados (debug/reset)
  const clearDeletedChats = () => {
    console.log('🧹 Lista de chats deletados localmente desativada');
    loadHistory(true);
  };

  // Função para formatar tempo relativo (ex: "há 2 minutos", "há 1 hora")
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Agora';
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - messageTime) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Agora';
    } else if (diffInSeconds < 3600) { // menos de 1 hora
      const minutes = Math.floor(diffInSeconds / 60);
      return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffInSeconds < 86400) { // menos de 24 horas
      const hours = Math.floor(diffInSeconds / 3600);
      return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else if (diffInSeconds < 2592000) { // menos de 30 dias
      const days = Math.floor(diffInSeconds / 86400);
      return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    } else {
      // Para mensagens muito antigas, mostra a data
      const day = messageTime.getDate().toString().padStart(2, '0');
      const month = (messageTime.getMonth() + 1).toString().padStart(2, '0');
      const year = messageTime.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  // Removido: carregamento de chats deletados do localStorage

  // Carregar histórico automaticamente ao iniciar a aplicação (com delay)
  useEffect(() => {
    // Adiciona um pequeno delay para evitar múltiplas chamadas simultâneas
    const timeoutId = setTimeout(() => {
      loadHistory();
    }, 1000); // 1 segundo de delay
    
    return () => clearTimeout(timeoutId);
  }, []); // Executa apenas uma vez ao montar o componente

  // Atualizar tempos relativos a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      // Força re-render para atualizar os tempos relativos
      setMessages(prev => [...prev]);
    }, 60000); // Atualiza a cada 60 segundos

    return () => clearInterval(interval);
  }, []);

  // Função para calcular diferença de tempo e gerar separadores
  const getTimeSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return null;
    
    const currentTime = new Date(currentMsg.timestamp);
    const previousTime = new Date(previousMsg.timestamp);
    const diffInMinutes = Math.floor((currentTime - previousTime) / (1000 * 60));
    
    // Só mostra separador se passou mais de 5 minutos
    if (diffInMinutes >= 5) {
      if (diffInMinutes < 60) {
        return `HÁ ${diffInMinutes} MINUTOS`;
      } else if (diffInMinutes < 1440) { // menos de 24 horas
        const hours = Math.floor(diffInMinutes / 60);
        return `HÁ ${hours} ${hours === 1 ? 'HORA' : 'HORAS'}`;
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        return `HÁ ${days} ${days === 1 ? 'DIA' : 'DIAS'}`;
      }
    }
    
    return null;
  };

  // Função para renderizar separador de tempo
  const renderTimeSeparator = (text) => (
    <div className="flex items-center justify-center my-6">
      <div className="flex-1 h-px bg-gray-300"></div>
      <span className="px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
        {text}
      </span>
      <div className="flex-1 h-px bg-gray-300"></div>
    </div>
  );

  // Carregar histórico quando abrir o sidebar (se ainda não foi carregado)
  useEffect(() => {
    if (isHistoryOpen && !historyLoaded) {
      loadHistory();
    }
  }, [isHistoryOpen]);

  // Função para gerar título correto (igual ao histórico)
  const generateCorrectTitle = (chat) => {
    // Se tem título editado manualmente (não é pergunta nem formato de data padrão), usa ele
    if (chat.title && 
        !chat.title.startsWith('Olá') && 
        !chat.title.startsWith('Como posso') && 
        !chat.title.startsWith('Qual') && 
        !chat.title.endsWith('?')) {
      
      // Se começa com "Chat ", verifica se é o formato de data padrão
      if (chat.title.startsWith('Chat ')) {
        const dateRegex = /^Chat \d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(chat.title)) {
          // Não é formato de data padrão, é título editado
          return chat.title;
        }
        // É formato de data padrão, continua para gerar pela data real
      } else {
        // Não começa com "Chat ", é título editado
        return chat.title;
      }
    }
    
    // Gera título baseado na data
    const chatDate = chat.timestamp || chat.created_at || chat.updated_at || chat.date;
    if (chatDate) {
      const date = new Date(chatDate);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `Chat ${day}/${month}/${year}`;
      }
    }
    
    // Fallback: data atual
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  return `Chat ${day}/${month}/${year}`;
  };

  const extractMessagesFromChatData = (chatData, fallbackChat) => {
    if (chatData.messages && Array.isArray(chatData.messages)) {
      return chatData.messages;
    }

    if (chatData.history && Array.isArray(chatData.history)) {
      return chatData.history;
    }

    if (chatData.conversation && Array.isArray(chatData.conversation)) {
      return chatData.conversation;
    }

    if (chatData.data && chatData.data.messages && Array.isArray(chatData.data.messages)) {
      return chatData.data.messages;
    }

    if (fallbackChat && fallbackChat.messages && Array.isArray(fallbackChat.messages)) {
      console.log('Usando mensagens do historico como fallback');
      return fallbackChat.messages;
    }

    return [];
  };

  const normalizeMediaUrl = (value) => {
    if (!value || typeof value !== 'string') return value;
    let url = value.trim();
    // Remove aspas no fim ou no começo (incluindo %22)
    url = url.replace(/^"+|"+$/g, '');
    url = url.replace(/^%22|%22$/gi, '');
    return url;
  };

  const coercePayloadObject = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.warn('Falha ao parsear payload JSON:', error);
        return null;
      }
    }
    return value;
  };

  const formatMessagesForUI = (messagesToLoad) => {
    return messagesToLoad.map((msg, index) => {
      let messageType = 'ai';
      if (msg.type) {
        messageType = msg.type;
      } else if (msg.sender) {
        messageType = msg.sender;
      } else if (msg.role) {
        messageType = msg.role === 'user' ? 'user' : 'ai';
      } else if (msg.is_user || msg.isUser) {
        messageType = 'user';
      }

      const messageText = msg.text || msg.content || msg.message || msg.response || '';
      const sourcesPayload = coercePayloadObject(
        msg.sources_payload || msg.sourcesPayload || msg.sources
      );
      const mediaPayload = coercePayloadObject(
        msg.media_payload || msg.mediaPayload || msg.media_payloads || msg.mediaPayloads || msg.media
      );

      let references = Array.isArray(msg.references) ? msg.references : null;
      if (!references && sourcesPayload && Array.isArray(sourcesPayload.documents)) {
        references = sourcesPayload.documents.map(doc => ({
          source: doc.name || doc.id,
          page: doc.pages,
          link: normalizeMediaUrl(doc.Link || doc.link)
        }));
      }

      let media = Array.isArray(msg.media) ? msg.media : null;
      if (!media && mediaPayload) {
        const collected = [];
        if (Array.isArray(mediaPayload.videos)) {
          mediaPayload.videos.forEach((video) => {
            collected.push({
              type: 'video',
              title: video.name || video.title,
              url: normalizeMediaUrl(video.Link || video.link || video.url),
              source: video.source
            });
          });
        }
        if (Array.isArray(mediaPayload.images)) {
          mediaPayload.images.forEach((image) => {
            collected.push({
              type: 'image',
              url: normalizeMediaUrl(image.Link || image.link || image.url),
              alt: image.name || image.title
            });
          });
        }
        if (collected.length > 0) {
          media = collected;
        }
      }

      return {
        id: index + 1,
        type: messageType,
        text: messageText,
        timestamp: new Date(msg.timestamp || msg.created_at || msg.date || Date.now()),
        messageId: msg.id || msg.message_id || `msg-${index}`,
        isWelcome: index === 0 && messageType === 'ai',
        references,
        media
      };
    });
  };

  // Função para salvar conversa automaticamente
  const saveCurrentChat = async () => {
    try {
      // Só salva se tiver mensagens além da mensagem de boas-vindas
      const userMessages = messages.filter(msg => msg.type === 'user');
      if (userMessages.length === 0) return;

      const chatData = {
        session_id: sessionId,
        title: chatTitle, // ✅ Sempre usa o título atual (padrão ou editado)
        messages: messages.filter(msg => !msg.isWelcome), // Remove mensagem de boas-vindas
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 Salvando conversa automaticamente:', chatData);
      console.log('📝 Título sendo salvo:', chatTitle);
      
      const result = await saveChat(chatData);
      
      // Verifica se salvou com sucesso (não retornou ok: false)
      if (result && result.ok === false) {
        console.log('⚠️ Salvamento não disponível (endpoint não implementado)');
      } else if (result) {
        console.log('✅ Conversa salva com sucesso!');
        // Força recarregamento do histórico na próxima abertura
        setHistoryLoaded(false);
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível salvar conversa:', error.message);
      // Não é crítico, continua funcionando normalmente
    }
  };

  // Salvar conversa automaticamente quando há mudanças nas mensagens
  useEffect(() => {
    // Debounce: salva 2 segundos após a última mudança
    const timeoutId = setTimeout(() => {
      if (messages.length > 1) { // Só salva se tiver mais que a mensagem de boas-vindas
        saveCurrentChat();
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [messages, chatTitle, sessionId]);



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      const userMessageText = message.trim();
      const userMsgId = `user-msg-${Date.now()}`;
      
      // Adiciona mensagem do usuário
      const userMessage = {
        id: messages.length + 1,
        type: 'user',
        text: userMessageText,
        timestamp: new Date(),
        messageId: userMsgId
      };
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      
      setIsLoading(true);
      
      // Cria mensagem da IA vazia para ir preenchendo
      const aiMsgId = `ai-msg-${Date.now()}`;
      const aiMessageId = messages.length + 2;
      
      const initialAiMessage = {
        id: aiMessageId,
        type: 'ai',
        text: '',
        media: [],
        timestamp: new Date(),
        messageId: aiMsgId,
        isStreaming: true
      };
      setMessages(prev => [...prev, initialAiMessage]);
      
      try {
        let currentSessionId = sessionId;
        let aiResponse = null;
        let streamUrl = null;
        
        // Se é a primeira mensagem (apenas mensagem de boas-vindas), inicia nova conversa
        if (messages.length === 1) {
          console.log('🆕 Iniciando nova conversa...');
          const chatResponse = await startChat(userMessageText);
          currentSessionId = chatResponse.session_id;
          aiResponse = chatResponse.response || chatResponse.message || chatResponse.answer || chatResponse.text;
          
          // Pega o stream_url se disponível
          if (chatResponse.stream_url) {
            console.log('🔗 Stream URL fornecida pelo backend:', chatResponse.stream_url);
            streamUrl = chatResponse.stream_url;
          }
          
          setSessionId(currentSessionId);
          setCurrentChatId(currentSessionId);

          if (pendingTitleRename && chatTitle) {
            try {
              console.log('📝 Aplicando título pendente:', chatTitle);
              await renameChat(currentSessionId, chatTitle);
              setPendingTitleRename(false);
            } catch (error) {
              console.warn('⚠️ Falha ao aplicar título pendente:', error.message);
            }
          }
          
          // ✅ Atualiza histórico imediatamente após iniciar nova conversa
          console.log('🔄 Atualizando histórico após nova conversa...');
          loadHistory(true);
          
          console.log('✅ Nova conversa iniciada:', currentSessionId);
          console.log('📝 Resposta da IA:', aiResponse);
        } else {
          // Mensagens seguintes: envia mensagem na conversa existente
          console.log('💬 Enviando mensagem na conversa:', currentSessionId);
          const messageResponse = await sendChatMessage(currentSessionId, userMessageText);
          aiResponse = messageResponse.response || messageResponse.message || messageResponse.answer || messageResponse.text;
          
          // Pega o stream_url se disponível
          if (messageResponse.stream_url) {
            console.log('🔗 Stream URL fornecida pelo backend:', messageResponse.stream_url);
            streamUrl = messageResponse.stream_url;
          }
          
          console.log('📝 Resposta da IA:', aiResponse);
        }
        
        // Se temos resposta direta, usa ela
        if (aiResponse) {
          console.log('✅ Usando resposta direta do backend');
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, text: aiResponse, isStreaming: false }
                : msg
            )
          );
          setIsLoading(false);
          
          // ✅ Atualiza o histórico
          console.log('🔄 Atualizando histórico após nova mensagem...');
          loadHistory(true);
        } else {
          // Fallback: tenta streaming (caso o backend suporte)
          console.log('⚠️ Resposta não encontrada, tentando streaming...');
          await getChatStream(
            currentSessionId,
            // onChunk - atualiza a mensagem conforme chega
            (chunk, accumulated, meta) => {
              if (meta?.media) {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, media: [ ...(msg.media || []), ...meta.media ] }
                      : msg
                  )
                );
                return;
              }

              if (meta?.sources) {
                const references = meta.sources.map(doc => ({
                  source: doc.name || doc.id,
                  page: doc.pages,
                  link: doc.Link || doc.link
                }));
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, references }
                      : msg
                  )
                );
                return;
              }

              setMessages(prev => 
                prev.map(msg => 
                  msg.id === aiMessageId 
                    ? { ...msg, text: accumulated }
                    : msg
                )
              );
            },
            // onComplete - finaliza o streaming
            (finalText) => {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === aiMessageId 
                    ? { ...msg, text: finalText, isStreaming: false }
                    : msg
                )
              );
              setIsLoading(false);
              
              // ✅ Atualiza o histórico
              console.log('🔄 Atualizando histórico após nova mensagem...');
              loadHistory(true);
              
              console.log('✅ Mensagem processada com sucesso!');
            },
            // onError - trata erros
            (error) => {
              console.error('❌ Erro no streaming:', error);
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === aiMessageId 
                    ? { 
                        ...msg, 
                        text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
                        isStreaming: false 
                      }
                    : msg
                )
              );
              setIsLoading(false);
            },
            // streamUrl - URL fornecida pelo backend
            streamUrl
          );
        }
        
      } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        
        // Detecta se é erro 500 (problema no servidor)
        const isServerError = error.message.includes('500') || error.message.includes('Servidor com problema');
        
        let errorMessage = 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
        
        if (isServerError) {
          errorMessage = `🔧 Sistema Temporariamente Indisponível

O servidor está passando por instabilidade técnica.

📋 O que você pode fazer:
• Aguardar alguns minutos e tentar novamente
• Consultar as apostilas oficiais do curso
• Anotar suas dúvidas para perguntar depois

⏰ Tente novamente em alguns minutos
🔧 Nossa equipe técnica foi notificada automaticamente

Status: Erro 500 - Problema interno do servidor`;
        }
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  text: errorMessage,
                  isStreaming: false 
                }
              : msg
          )
        );
        setIsLoading(false);
      }
    }
  };

  // Função para enviar feedback (like/dislike)
  const handleFeedback = async (messageId, isPositive) => {
    const feedbackType = isPositive ? 'like' : 'dislike';
    const currentFeedback = feedbackGiven[messageId];
    
    // Se já está enviando, não permite novo clique
    if (currentFeedback?.status === 'sending') {
      console.log('⚠️ Feedback sendo enviado, aguarde...');
      return;
    }
    
    // Se clicou no mesmo botão que já está selecionado, não faz nada
    if (currentFeedback?.type === feedbackType && currentFeedback?.status === 'sent') {
      console.log(`⚠️ ${feedbackType} já foi dado para esta mensagem`);
      return;
    }

    try {
      const rating = isPositive ? 'positive' : 'negative';
      
      // Marca o feedback como "enviando" para evitar duplo clique
      setFeedbackGiven(prev => ({
        ...prev,
        [messageId]: { type: feedbackType, status: 'sending' }
      }));
      
      // Verifica se o sessionId é um UUID válido
      const isValidUUID = (str) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };
      
      // Se o sessionId não for UUID válido, gera um novo
      let validSessionId = sessionId;
      if (!isValidUUID(sessionId)) {
        validSessionId = generateUUID();
        setSessionId(validSessionId);
        console.warn(`⚠️ Session ID "${sessionId}" não é UUID válido, gerando novo: ${validSessionId}`);
      }
      
      console.log(`📝 Tentando enviar feedback ${feedbackType} para mensagem:`, messageId);
      console.log(`📝 Session ID válido:`, validSessionId);
      
      await sendFeedback(validSessionId, messageId, rating);
      console.log(`✅ Feedback ${feedbackType} enviado com sucesso!`);
      
      // Marca o feedback como enviado com sucesso
      setFeedbackGiven(prev => ({
        ...prev,
        [messageId]: { type: feedbackType, status: 'sent' }
      }));
      
    } catch (error) {
      console.error(`❌ Erro ao enviar feedback:`, error.message);
      
      // Remove o feedback em caso de erro para permitir nova tentativa
      setFeedbackGiven(prev => {
        const newState = { ...prev };
        delete newState[messageId];
        return newState;
      });
      
      // Se for erro 422, pode ser que o backend espera um formato diferente
      if (error.message.includes('422')) {
        console.warn('⚠️ O backend pode estar esperando um formato diferente de dados.');
        console.warn('⚠️ Verifique com o time de backend o formato esperado para o endpoint /chat/feedback');
      }
    }
  };

  // Função para copiar texto para área de transferência
  const handleCopyMessage = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      
      // Marca como copiado
      setCopiedMessages(prev => ({
        ...prev,
        [messageId]: true
      }));
      
      // Remove o estado após 2 segundos
      setTimeout(() => {
        setCopiedMessages(prev => {
          const newState = { ...prev };
          delete newState[messageId];
          return newState;
        });
      }, 2000);
      
      console.log('✅ Texto copiado com sucesso!');
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        
        // Marca como copiado mesmo no fallback
        setCopiedMessages(prev => ({
          ...prev,
          [messageId]: true
        }));
        
        // Remove o estado após 2 segundos
        setTimeout(() => {
          setCopiedMessages(prev => {
            const newState = { ...prev };
            delete newState[messageId];
            return newState;
          });
        }, 2000);
        
        console.log('✅ Texto copiado com sucesso (fallback)!');
      } catch (err) {
        console.error('Erro ao copiar texto (fallback):', err);
      }
      document.body.removeChild(textArea);
    }
  };

  // Função para deletar conversa do histórico
  const handleDeleteChat = async (chat) => {
    const chatId = chat.id || chat.session_id || chat.chat_id;

    // Remove da lista local imediatamente
    setChatHistory(prev => prev.filter(c => 
      (c.id || c.session_id || c.chat_id) !== chatId
    ));
    
    // Se a conversa deletada é a atual, limpa o chat
    if (currentChatId === chatId || sessionId === chatId) {
      handleNewChat();
    }
    
    // Tenta deletar no backend (se o endpoint existir)
    try {
      console.log('🗑️ Tentando deletar conversa no backend:', chatId);
      await deleteChat(chatId);
      console.log('✅ Conversa deletada com sucesso no backend!');
    } catch (error) {
      console.log('⚠️ Erro ao deletar no backend (mantendo delete local):', error.message);
    }
    
    console.log('✅ Conversa removida da interface');
  };

  // Função para carregar uma conversa do histórico
  const handleLoadChat = async (chat) => {
    console.log('🔍 Carregando chat:', chat);
    
    try {
      // Define o ID do chat atual
      const chatId = chat.id || chat.session_id || chat.chat_id;
      setCurrentChatId(chatId);
      setSessionId(chatId);
      
      // Atualiza o título usando a mesma lógica do histórico
      setChatTitle(generateCorrectTitle(chat));
      
      // Carrega a conversa completa da API
      console.log('📡 Buscando conversa completa da API:', chatId);
        const chatData = await loadChat(chatId);
        
        if (!chatData) {
          console.log('⚠️ Conversa não encontrada no backend, iniciando nova.');
          localStorage.removeItem('activeChatId');
          setMessages([
            {
              id: 1,
              type: 'ai',
              text: 'Olá! Eu sou a SEN.AI, sua parceira de estudo.',
              isWelcome: true,
              timestamp: new Date(),
              messageId: 'welcome-msg'
            }
          ]);
          setIsHistoryOpen(false);
          return;
        }

        console.log('📦 Dados da conversa carregados:', chatData);
      
      const messagesToLoad = extractMessagesFromChatData(chatData, chat);


      console.log('📝 Mensagens encontradas:', messagesToLoad);
      
      if (messagesToLoad.length > 0) {
        const formattedMessages = formatMessagesForUI(messagesToLoad);


        console.log('✅ Mensagens formatadas:', formattedMessages);
        setMessages(formattedMessages);
      } else {
        console.log('⚠️ Nenhuma mensagem encontrada, usando mensagem padrão');
        // Se não tiver mensagens, inicia com mensagem de boas-vindas
        setMessages([
          {
            id: 1,
            type: 'ai',
            text: 'Olá! Eu sou a SEN.AI, sua parceira de estudo.',
            isWelcome: true,
            timestamp: new Date(),
            messageId: 'welcome-msg'
          }
        ]);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar conversa:', error);
      
      // Fallback: usar dados básicos do histórico
      const chatId = chat.id || chat.session_id || chat.chat_id;
      setCurrentChatId(chatId);
      setSessionId(chatId);
      setChatTitle(generateCorrectTitle(chat));
      
      // Mensagem padrão em caso de erro
      setMessages([
        {
          id: 1,
          type: 'ai',
          text: 'Olá! Eu sou a SEN.AI, sua parceira de estudo.',
          isWelcome: true,
          timestamp: new Date(),
          messageId: 'welcome-msg'
        }
      ]);
    }
    
    // Limpa o estado de feedback e cópia ao carregar nova conversa
    setFeedbackGiven({});
    setCopiedMessages({});
    
    // Fecha o histórico
    setIsHistoryOpen(false);
  };

  useEffect(() => {
    let ignore = false;
    const restoreActiveChat = async () => {
      let storedChatId = null;
        try {
          const urlParams = new URLSearchParams(window.location.search);
          storedChatId =
            urlParams.get('active_chat_id') ||
            urlParams.get('session_id') ||
            urlParams.get('sid') ||
            urlParams.get('chat_id');
          if (storedChatId) {
            localStorage.setItem('activeChatId', storedChatId);
          }
        } catch (error) {
          console.warn('Falha ao ler active_chat_id da URL:', error);
        }

      try {
        if (!storedChatId) {
          storedChatId = localStorage.getItem('activeChatId');
        }
      } catch (error) {
        console.warn('Falha ao ler activeChatId do localStorage:', error);
        return;
      }

      if (!storedChatId) return;
      if (storedChatId === currentChatId || storedChatId === sessionId) return;

      try {
        console.log('Tentando restaurar chat ativo do storage:', storedChatId);
        const history = await getChatHistory();
        if (ignore) return;

        if (Array.isArray(history)) {
          const match = history.find((chat) => {
            const chatId = chat.id || chat.session_id || chat.chat_id;
            return chatId === storedChatId;
          });

          if (match) {
            await handleLoadChat(match);
            return;
          }
        }

        console.log('Chat nao encontrado no historico, carregando direto pela API.');
          const chatData = await loadChat(storedChatId);
          if (ignore) return;

          if (!chatData) {
            console.log('Chat inexistente no backend, limpando activeChatId.');
            localStorage.removeItem('activeChatId');
            return;
          }

          const messagesToLoad = extractMessagesFromChatData(chatData, null);
        setCurrentChatId(storedChatId);
        setSessionId(storedChatId);
        setChatTitle(generateCorrectTitle(chatData));

        if (messagesToLoad.length > 0) {
          setMessages(formatMessagesForUI(messagesToLoad));
        } else {
          setMessages([
            {
              id: 1,
              type: 'ai',
              text: 'OlÃ¡! Eu sou a SEN.AI, sua parceira de estudo.',
              isWelcome: true,
              timestamp: new Date(),
              messageId: 'welcome-msg'
            }
          ]);
        }

        setFeedbackGiven({});
        setCopiedMessages({});
      } catch (error) {
        console.error('Erro ao restaurar chat ativo:', error);
      }
    };

    restoreActiveChat();
    return () => {
      ignore = true;
    };
  }, []);

  const handleNewChat = () => {
    // A nova API salva automaticamente, então só precisamos limpar a interface
    console.log('🆕 Iniciando nova conversa...');
    
    // Cria nova sessão com UUID válido
    const newSessionId = generateUUID();
    setSessionId(newSessionId);
    setCurrentChatId(null);
    
    // Reseta as mensagens para o estado inicial
    setMessages([
      {
        id: 1,
        type: 'ai',
        text: 'Olá! Eu sou a SEN.AI, sua parceira de estudo.',
        isWelcome: true,
        timestamp: new Date(),
        messageId: 'welcome-msg'
      }
    ]);
    
    // Limpa o estado de feedback e cópia
    setFeedbackGiven({});
    setCopiedMessages({});
    
    // Cria novo título com data atual
    const now = new Date();
    setChatTitle(`Chat ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`);
    
    // Força reload do histórico na próxima abertura
    setHistoryLoaded(false);
    
    console.log('✅ Nova conversa iniciada!');
  };

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
  };

  useEffect(() => {
    const hasUserMessages = messages.some((msg) => msg.type === 'user');
    if (!hasUserMessages) return;

    const activeChatId = currentChatId || sessionId;
    if (!activeChatId) return;

    try {
      localStorage.setItem('activeChatId', activeChatId);
    } catch (error) {
      console.warn('Falha ao salvar activeChatId no localStorage:', error);
    }

    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: 'senai_active_chat', chatId: activeChatId },
          '*'
        );
      }
    } catch (error) {
      console.warn('Falha ao enviar activeChatId via postMessage:', error);
    }
  }, [messages, currentChatId, sessionId]);

  const handleTitleChange = (e) => {
    setChatTitle(e.target.value);
  };

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    
    // Salva o novo título no backend se tiver mensagens do usuário
    const userMessages = messages.filter(msg => msg.type === 'user');
    if (userMessages.length > 0) {
      try {
        console.log('📝 Salvando novo título:', chatTitle);
        await renameChat(sessionId, chatTitle);
        console.log('✅ Título salvo com sucesso!');
        
        // Força recarregamento do histórico para refletir a mudança
        setHistoryLoaded(false);
        if (isHistoryOpen) {
          loadHistory(true);
        }
      } catch (error) {
        console.error('❌ Erro ao salvar título:', error);
      }
    } else {
      // Sem mensagens ainda: agenda para renomear após a primeira pergunta
      setPendingTitleRename(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#ffffff]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-2 md:py-3 flex-shrink-0 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          {/* Left side - Logo and Chat Title */}
          <div className="flex items-center gap-2 md:gap-4">
            <img 
              src={ultimasConversas} 
              alt="SEN.Ai Logo" 
              className="w-16 h-auto md:w-[100px]"
            />
            
            <div className="hidden md:flex items-center gap-2 bg-[#262626] text-[#F2F2F2] px-4 py-2 rounded-md text-sm">
              <button 
                onClick={handleTitleEdit}
                className="p-0.5 text-[#F2F2F2] hover:text-white transition-colors"
              >
                <Pencil size={14} />
              </button>
              {isEditingTitle ? (
                <input
                  type="text"
                  value={chatTitle}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTitleBlur();
                    }
                  }}
                  autoFocus
                  className="bg-transparent border-none focus:outline-none text-[#F2F2F2] text-sm"
                  style={{ width: '180px' }}
                />
              ) : (
                <span className="text-sm font-medium">{chatTitle}</span>
              )}
            </div>
            
            {/* Mobile: Chat title button */}
            <button 
              onClick={handleTitleEdit}
              className="flex md:hidden items-center gap-2 bg-[#262626] text-[#F2F2F2] px-3 py-1.5 rounded-md text-xs hover:bg-[#1a1a1a] transition-colors"
            >
              <Pencil size={12} />
              {isEditingTitle ? (
                <input
                  type="text"
                  value={chatTitle}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTitleBlur();
                    }
                  }}
                  autoFocus
                  className="bg-transparent border-none focus:outline-none text-[#F2F2F2] text-xs"
                  style={{ width: '140px' }}
                />
              ) : (
                <span className="text-xs font-medium">{chatTitle}</span>
              )}
            </button>
          </div>
          
          {/* Right side - Nova conversa, History and User */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Desktop: Nova conversa com texto */}
            <button 
              onClick={handleNewChat}
              className="hidden md:flex items-center gap-2 bg-[#262626] text-[#F2F2F2] px-4 py-2 rounded-md text-sm hover:bg-[#1a1a1a] transition-colors"
            >
              <img src={novaConversaIcon} alt="Nova conversa" className="w-4 h-4" />
              Nova conversa
            </button>
            
            {/* Mobile: Nova conversa só ícone */}
            <button 
              onClick={handleNewChat}
              className="flex md:hidden bg-[#262626] text-[#F2F2F2] rounded-md hover:bg-[#1a1a1a] transition-colors items-center justify-center"
              style={{ 
                width: '32px', 
                height: '32px',
                padding: '6px'
              }}
            >
              <img src={novaConversaIcon} alt="Nova conversa" className="w-4 h-4" />
            </button>
            
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="text-[#F2F2F2] rounded-md transition-colors flex items-center justify-center" 
              style={{ 
                width: '32px', 
                height: '32px',
                padding: '6px',
                backgroundColor: isHistoryOpen ? '#C13A0D' : '#262626'
              }}
            >
              <img src={historicoIcon} alt="Histórico" className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            
            {/* Desktop: User info completo */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 bg-[#EEF4FF] rounded-full flex items-center justify-center">
                <User size={18} className="text-[#BAD4FF]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">{getDisplayUserName(moodleUser)}</p>
                <p className="text-xs text-[#EF5E31] cursor-pointer hover:text-[#d54d25]">Sair</p>
              </div>
            </div>
            
            {/* Mobile: Só o ícone do usuário */}
            <button className="flex md:hidden w-7 h-7 bg-[#EEF4FF] rounded-full items-center justify-center">
              <User size={16} className="text-[#BAD4FF]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-3 md:px-6 w-full py-6 md:py-12">
          {/* Logo and Welcome */}
          <div className="text-center mb-8 md:mb-16">
            <div className="mb-6 md:mb-8 flex justify-center">
              <img 
                src={fiergsSenaiLogo} 
                alt="FIERGS SEN.Ai"
                className="w-48 md:w-auto"
              />
            </div>
            
            <h2 className="text-base md:text-xl font-semibold text-gray-900 mb-8 md:mb-12 px-4">
              Bem-vindo(a) à inteligência artificial do SENAI
            </h2>

            {/* Action Cards */}
            <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6 px-4">
              {/* Card 1 */}
              <div 
                className="bg-[#FFFFFF] rounded-2xl transition-shadow cursor-pointer text-left flex flex-col w-full md:w-[160px]"
                style={{ 
                  height: '178px', 
                  padding: '16px',
                  boxShadow: '0px 0px 12px 0px #C3E9FC80'
                }}
              >
                <div 
                  className="bg-[#FFEFEA] flex items-center justify-center mb-3" 
                  style={{ 
                    width: '40px', 
                    height: '40px',
                    borderRadius: '8px',
                    padding: '4px',
                    opacity: 1
                  }}
                >
                  <img src={questionIcon} alt="Question" className="w-6 h-6" />
                </div>
                <h3 
                  className="text-[#2D2D2D] mb-2"
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '14px',
                    lineHeight: '100%',
                    letterSpacing: '0.1px'
                  }}
                >
                  Quero ajuda para tirar minhas dúvidas
                </h3>
                <p 
                  className="text-[#BDBDBD]"
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '100%',
                    letterSpacing: '0.4px'
                  }}
                >
                  Precisa de ajuda para usar a SEN.AI? Clique aqui para obter ajuda do assistente
                </p>
              </div>

              {/* Card 2 */}
              <div 
                className="bg-[#FFFFFF] rounded-2xl transition-shadow cursor-pointer text-left flex flex-col w-full md:w-[160px]"
                style={{ 
                  height: '178px', 
                  padding: '16px',
                  boxShadow: '0px 0px 12px 0px #C3E9FC80'
                }}
                onClick={() => setIsHistoryOpen(true)}
              >
                <div 
                  className="bg-[#FFEFEA] flex items-center justify-center mb-3" 
                  style={{ 
                    width: '40px', 
                    height: '40px',
                    borderRadius: '8px',
                    padding: '4px',
                    opacity: 1
                  }}
                >
                  <img src={vectorLogo} alt="Histórico" className="w-6 h-6" />
                </div>
                <h3 
                  className="text-[#2D2D2D] mb-2"
                  style={{ 
                    fontFamily: 'Inter, sans-serif',

                    fontWeight: 700,
                    fontSize: '14px',
                    lineHeight: '100%',
                    letterSpacing: '0.1px'
                  }}
                >
                  Quais foram suas últimas conversas?
                </h3>
                <p 
                  className="text-[#BDBDBD]"
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '100%',
                    letterSpacing: '0.4px'
                  }}
                >
                  Aqui você pode relembrar ou continuar de uma conversa anterior
                </p>
              </div>
            </div>
          </div>
          
          {/* Chat Messages */}
          {messages.length > 0 && (
            <div className="space-y-4 md:space-y-6 mt-6 md:mt-8">
              {messages.map((msg, index) => {
                const previousMsg = index > 0 ? messages[index - 1] : null;
                const timeSeparator = getTimeSeparator(msg, previousMsg);
                
                return (
                  <div key={msg.id}>
                    {/* Separador de tempo se necessário */}
                    {timeSeparator && renderTimeSeparator(timeSeparator)}
                    
                    {/* Mensagem */}
                <div 
                  key={msg.id} 
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'user' ? (
                    <div className="max-w-[95%] md:max-w-[80%]">
                      {/* Caixa da mensagem do usuário */}
                      <div 
                        className="rounded-2xl px-4 md:px-6 py-3 md:py-4"
                        style={{ backgroundColor: '#F6FBFF' }}
                      >
                        {/* Header com Nome do aluno */}
                        <div className="mb-3 pb-3 border-b border-gray-200">
                          <span className="text-[#003d7a] font-bold text-sm">{getDisplayUserName(moodleUser)}</span>
                          <span className="text-gray-400 text-sm"> · {formatRelativeTime(msg.timestamp)}</span>
                        </div>
                        
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        
                        {/* Footer com botão copiar */}
                        <div className="flex items-center justify-end mt-4">
                          <button 
                            onClick={() => handleCopyMessage(msg.text, msg.messageId)}
                            className="hover:opacity-80 transition-opacity flex items-center justify-center"
                          >
                            {copiedMessages[msg.messageId] ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17L4 12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              <img src={copiarIcon} alt="Copiar" style={{ width: '16px', height: '16px' }} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full md:w-full">
                      {/* Caixa da mensagem */}
                      <div 
                        className="bg-white rounded-2xl px-4 md:px-6 py-3 md:py-4"
                        style={{ border: '1px solid #DFDFDF' }}
                      >
                        {/* Header com Sen.ai dentro da caixa */}
                        <div className="mb-3 pb-3 border-b border-gray-200">
                          <span className="text-[#FF6B35] font-bold text-sm">Sen.ai</span>
                          <span className="text-gray-400 text-sm"> · {formatRelativeTime(msg.timestamp)}</span>
                        </div>
                        
                        {msg.isWelcome ? (
                          <div className="text-gray-700 text-sm leading-relaxed">
                            <p className="font-bold mb-4">{msg.text}</p>
                            <p className="mb-4">Estou aqui para facilitar sua jornada.</p>
                            <p className="mb-4">
                              Você pode me perguntar sobre qualquer <span style={{ color: '#E84910', fontWeight: 600 }}>conteúdo do seu curso</span>: conceitos, atividades, documentos ou trechos das apostilas. Meu papel é te dar as melhores respostas sobre <span style={{ color: '#E84910', fontWeight: 600 }}>o conteúdo do seu curso</span>.
                            </p>
                            <p className="mb-4">Estou limitada nosso conteúdo interno. Não posso responder outras dúvidas, como por exemplo, fazer um bolo.</p>
                            <p className="mb-4">Pode contar comigo para tornar o aprendizado mais leve, claro e acessível. 😉</p>
                            <p>Vamos juntos!</p>
                          </div>
                        ) : (
                          <AIMessageContent message={msg} />
                        )}
                        
                        {/* Footer com feedback */}
                        <div className="flex items-center justify-end mt-4">
                          {/* Mostrar feedback completo apenas a partir da segunda mensagem da IA */}
                          {msg.id > 1 && (
                            <div className="flex items-center">
                              <span className="text-xs text-gray-400 italic">Dê seu feedback sobre a resposta</span>
                              <div className="flex items-center gap-2 ml-2">
                                {/* Dislike */}
                                <button 
                                  onClick={() => handleFeedback(msg.messageId, false)}
                                  disabled={feedbackGiven[msg.messageId]?.status === 'sending'}
                                  className={`transition-all ${
                                    feedbackGiven[msg.messageId]?.status === 'sending' 
                                      ? 'opacity-50 cursor-not-allowed' 
                                      : 'hover:opacity-80'
                                  }`}
                                  style={{ 
                                    background: 'none',
                                    border: 'none',
                                    padding: '0',
                                    margin: '0'
                                  }}
                                >
                                  <img 
                                    src={dislikeIcon} 
                                    alt="Dislike" 
                                    style={{ 
                                      width: '14.89px', 
                                      height: '12.92px',
                                      display: 'block',
                                      filter: feedbackGiven[msg.messageId]?.type === 'dislike' && feedbackGiven[msg.messageId]?.status === 'sent'
                                        ? 'brightness(0) saturate(100%) invert(39%) sepia(88%) saturate(3066%) hue-rotate(9deg) brightness(97%) contrast(96%)'
                                        : 'none'
                                    }} 
                                  />
                                </button>
                                {/* Like */}
                                <button 
                                  onClick={() => handleFeedback(msg.messageId, true)}
                                  disabled={feedbackGiven[msg.messageId]?.status === 'sending'}
                                  className={`transition-all ${
                                    feedbackGiven[msg.messageId]?.status === 'sending' 
                                      ? 'opacity-50 cursor-not-allowed' 
                                      : 'hover:opacity-80'
                                  }`}
                                  style={{ 
                                    background: 'none',
                                    border: 'none',
                                    padding: '0',
                                    margin: '0'
                                  }}
                                >
                                  <img 
                                    src={likeIcon} 
                                    alt="Like" 
                                    style={{ 
                                      width: '14.89px', 
                                      height: '12.92px',
                                      display: 'block',
                                      filter: feedbackGiven[msg.messageId]?.type === 'like' && feedbackGiven[msg.messageId]?.status === 'sent'
                                        ? 'brightness(0) saturate(100%) invert(59%) sepia(98%) saturate(1946%) hue-rotate(201deg) brightness(97%) contrast(94%)'
                                        : 'none'
                                    }} 
                                  />
                                </button>
                                {/* Copiar */}
                                <button 
                                  onClick={() => handleCopyMessage(msg.text, msg.messageId)}
                                  className="hover:opacity-80 transition-opacity ml-2"
                                  style={{ 
                                    background: 'none',
                                    border: 'none',
                                    padding: '0',
                                    margin: '0',
                                    marginLeft: '8px'
                                  }}
                                >
                                  {copiedMessages[msg.messageId] ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M20 6L9 17L4 12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  ) : (
                                    <img 
                                      src={copiarIcon} 
                                      alt="Copiar" 
                                      style={{ 
                                        width: '16px', 
                                        height: '16px',
                                        display: 'block'
                                      }} 
                                    />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Primeira mensagem: apenas botão copiar */}
                          {msg.id === 1 && (
                            <button 
                              onClick={() => handleCopyMessage(msg.text)}
                              className="hover:opacity-80 transition-opacity flex items-center justify-center"
                            >
                              <img src={copiarIcon} alt="Copiar" style={{ width: '16px', height: '16px' }} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                    </div>
                  </div>
                );
              })}
              {/* Referência para scroll automático */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 pb-4 md:pb-8">
        <div className="max-w-[900px] mx-auto px-3 md:px-6 pt-3 md:pt-4">
          <div className="flex flex-col items-center">
            <form onSubmit={handleSubmit} className="relative mb-2 md:mb-3 w-full md:w-[688px]">
              {isLoading ? (
                // Estado de loading - mostra "Aguarde..."
                <div 
                  className="w-full rounded-lg border flex items-start justify-between"
                  style={{ height: '80px', borderColor: '#262626', padding: '12px' }}
                >
                  <span className="text-gray-500 text-sm">Aguarde...</span>
                  <button
                    type="button"
                    className="flex items-center justify-center"
                    style={{ 
                      width: '32px',
                      height: '32px'
                    }}
                  >
                    <Square size={20} style={{ color: '#E84910' }} fill="#E84910" />
                  </button>
                </div>
              ) : (
                // Estado normal - textarea editável
                <>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder="No que posso te ajudar hoje?"
                    className="w-full pr-12 md:pr-14 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 placeholder-gray-400 shadow-sm text-sm md:text-base resize-none"
                    style={{ height: '80px', borderColor: '#262626', padding: '12px' }}
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="absolute hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center rounded-md"
                    style={{ 
                      right: '12px', 
                      top: '12px',
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#E4ECF5'
                    }}
                  >
                    <img 
                      src={sendIcon} 
                      alt="Enviar" 
                      className="w-4 h-4 md:w-5 md:h-5 transition-all"
                      style={{
                        filter: message.trim() 
                          ? 'brightness(0) saturate(100%) invert(17%) sepia(89%) saturate(1729%) hue-rotate(203deg) brightness(93%) contrast(95%)'
                          : 'none'
                      }}
                    />
                  </button>
                </>
              )}
            </form>
            
            <p className="text-center text-xs text-gray-500 px-4">
              IAs podem cometer erros,{' '}
              <span className="text-[#a855f7] font-medium">
                verifique as informações mais importantes.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar de Histórico */}
      <HistorySidebar 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={chatHistory}
        onSelectChat={handleLoadChat}
        isLoading={isLoadingHistory}
        onRefresh={handleRefreshHistory}
        onDeleteChat={handleDeleteChat}
      />
    </div>
  );
}

export default Welcome;
