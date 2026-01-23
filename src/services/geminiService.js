import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializa a API do Gemini
// IMPORTANTE: Substitua 'YOUR_API_KEY' pela sua chave de API do Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_API_KEY';
const genAI = new GoogleGenerativeAI(API_KEY);

// Configuração do modelo
const model = genAI.getGenerativeModel({ 
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  },
});

// Histórico da conversa
let chatHistory = [];

// Inicializa o chat com contexto do SENAI
export const initializeChat = () => {
  chatHistory = [
    {
      role: 'user',
      parts: [{ text: 'Você é a SEN.AI, uma assistente virtual inteligente do SENAI (Serviço Nacional de Aprendizagem Industrial). Seu objetivo é ajudar alunos, professores e interessados com informações sobre cursos, programas, matrículas e dúvidas gerais sobre o SENAI. Seja sempre educado, prestativo e objetivo nas respostas.' }]
    },
    {
      role: 'model',
      parts: [{ text: 'Entendido! Sou a SEN.AI, assistente virtual do SENAI. Estou aqui para ajudar com informações sobre cursos, programas, matrículas e esclarecer dúvidas sobre o SENAI. Como posso ajudá-lo hoje?' }]
    }
  ];
};

// Envia mensagem para o Gemini
export const sendMessage = async (userMessage) => {
  try {
    // Adiciona mensagem do usuário ao histórico
    chatHistory.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    // Inicia o chat com o histórico
    const chat = model.startChat({
      history: chatHistory.slice(0, -1), // Exclui a última mensagem que será enviada
    });

    // Envia a mensagem
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    // Adiciona resposta ao histórico
    chatHistory.push({
      role: 'model',
      parts: [{ text: text }]
    });

    return text;
  } catch (error) {
    console.error('Erro ao enviar mensagem para o Gemini:', error);
    throw new Error('Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.');
  }
};

// Limpa o histórico do chat
export const clearChatHistory = () => {
  chatHistory = [];
  initializeChat();
};

// Inicializa o chat ao carregar o módulo
initializeChat();
