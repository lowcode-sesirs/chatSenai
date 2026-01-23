/**
 * Validador de escopo para perguntas da IA
 * Verifica se a pergunta está relacionada ao conteúdo do curso
 */

// Palavras-chave relacionadas ao curso de Automação Industrial
const COURSE_KEYWORDS = [
  // Automação Industrial
  'automação', 'automatização', 'industrial', 'industria', 'fábrica', 'fabrica',
  'processo', 'processos', 'produção', 'producao', 'manufatura', 'sistema', 'sistemas',
  
  // Controladores
  'clp', 'plc', 'controlador', 'controladores', 'lógico', 'logico', 'programável', 'programavel',
  'ladder', 'blocos funcionais', 'texto estruturado', 'sequential function chart',
  'programação', 'programacao', 'lógica', 'logica',
  
  // Sensores e Atuadores
  'sensor', 'sensores', 'atuador', 'atuadores', 'transdutor', 'transdutores',
  'proximidade', 'temperatura', 'pressão', 'pressao', 'nível', 'nivel',
  'encoder', 'potenciômetro', 'potenciometro', 'termistor', 'termopar',
  'detecção', 'deteccao', 'medição', 'medicao',
  
  // Redes e Comunicação
  'rede', 'redes', 'comunicação', 'comunicacao', 'protocolo', 'protocolos',
  'ethernet', 'profibus', 'modbus', 'can', 'fieldbus', 'devicenet',
  'scada', 'hmi', 'supervisório', 'supervisorio', 'interface',
  
  // Componentes Elétricos
  'motor', 'motores', 'servo', 'inversor', 'frequência', 'frequencia',
  'contator', 'relé', 'rele', 'disjuntor', 'fusível', 'fusivel',
  'transformador', 'capacitor', 'resistor', 'indutor', 'elétrico', 'eletrico',
  
  // Instrumentação
  'instrumentação', 'instrumentacao', 'medição', 'medicao', 'calibração', 'calibracao',
  'válvula', 'valvula', 'bomba', 'compressor', 'ventilador', 'equipamento', 'equipamentos',
  
  // Segurança Industrial
  'segurança', 'seguranca', 'emergência', 'emergencia', 'parada', 'proteção', 'protecao',
  'categoria', 'sil', 'norma', 'nr12', 'iso', 'iec', 'risco', 'riscos',
  
  // Pneumática e Hidráulica
  'pneumática', 'pneumatica', 'hidráulica', 'hidraulica', 'cilindro', 'pistão', 'pistao',
  'compressor', 'reservatório', 'reservatorio', 'filtro', 'regulador', 'ar', 'óleo', 'oleo',
  
  // Eletrônica Industrial
  'eletrônica', 'eletronica', 'circuito', 'circuitos', 'amplificador', 'conversor',
  'analógico', 'analogico', 'digital', 'pwm', 'dac', 'adc', 'sinal', 'sinais',
  
  // Manutenção
  'manutenção', 'manutencao', 'preventiva', 'corretiva', 'preditiva',
  'diagnóstico', 'diagnostico', 'falha', 'falhas', 'defeito', 'defeitos',
  'reparo', 'reparos', 'conserto', 'consertos',
  
  // Termos Técnicos Gerais
  'técnico', 'tecnico', 'tecnologia', 'engenharia', 'mecânico', 'mecanico',
  'funcionamento', 'operação', 'operacao', 'instalação', 'instalacao',
  'configuração', 'configuracao', 'ajuste', 'ajustes',
  
  // Termos Gerais do SENAI
  'senai', 'apostila', 'curso', 'aula', 'módulo', 'modulo', 'capítulo', 'capitulo',
  'exercício', 'exercicio', 'atividade', 'prática', 'pratica', 'laboratório', 'laboratorio',
  
  // Perguntas comuns
  'como', 'que', 'qual', 'onde', 'quando', 'por', 'para', 'funciona', 'serve',
  'diferença', 'diferenca', 'vantagem', 'vantagens', 'aplicação', 'aplicacao'
];

// Palavras que claramente indicam tópicos fora do escopo
const OUT_OF_SCOPE_KEYWORDS = [
  // Veículos
  'carro', 'carros', 'automóvel', 'automovel', 'veículo', 'veiculo',
  'moto', 'motocicleta', 'bicicleta', 'caminhão', 'caminhao',
  
  // Culinária
  'receita', 'receitas', 'cozinha', 'comida', 'prato', 'pratos',
  'ingrediente', 'ingredientes', 'tempero', 'temperos',
  
  // Esportes
  'futebol', 'basquete', 'vôlei', 'volei', 'tênis', 'tenis',
  'natação', 'natacao', 'corrida', 'maratona',
  
  // Entretenimento
  'filme', 'filmes', 'série', 'series', 'novela', 'novelas',
  'música', 'musica', 'canção', 'cancao', 'banda', 'artista',
  
  // Outros tópicos
  'política', 'politica', 'religião', 'religiao', 'filosofia',
  'história', 'historia', 'geografia', 'matemática', 'matematica',
  'português', 'portugues', 'inglês', 'ingles'
];

/**
 * Verifica se uma pergunta está dentro do escopo do curso
 * @param {string} question - A pergunta do usuário
 * @returns {object} - { isValid: boolean, reason: string }
 */
export const validateQuestionScope = (question) => {
  if (!question || typeof question !== 'string') {
    return { isValid: false, reason: 'Pergunta inválida' };
  }

  const normalizedQuestion = question.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

  // Verifica se contém palavras claramente fora do escopo
  const hasOutOfScopeKeywords = OUT_OF_SCOPE_KEYWORDS.some(keyword => 
    normalizedQuestion.includes(keyword.toLowerCase())
  );

  if (hasOutOfScopeKeywords) {
    return { 
      isValid: false, 
      reason: 'Esta pergunta parece estar fora do escopo do curso de Automação Industrial.' 
    };
  }

  // Verifica se contém palavras relacionadas ao curso
  const hasCourseKeywords = COURSE_KEYWORDS.some(keyword => 
    normalizedQuestion.includes(keyword.toLowerCase())
  );

  // Se a pergunta é muito curta (menos de 15 caracteres), permite
  if (normalizedQuestion.length < 15) {
    return { isValid: true, reason: 'Pergunta muito curta, permitindo' };
  }

  // Se contém palavras do curso, permite
  if (hasCourseKeywords) {
    return { isValid: true, reason: 'Pergunta contém palavras-chave do curso' };
  }

  // Se não tem palavras claramente fora do escopo e não tem palavras do curso,
  // vamos ser mais permissivos e permitir (pode ser uma pergunta técnica genérica)
  return { isValid: true, reason: 'Pergunta técnica genérica, permitindo' };

  return { isValid: true, reason: 'Pergunta dentro do escopo' };
};

/**
 * Gera uma resposta padrão para perguntas fora do escopo
 * @returns {object} - Objeto de resposta formatado
 */
export const generateOutOfScopeResponse = () => {
  return {
    text: `Desculpe, mas não posso responder sobre esse tópico, pois estou limitada ao conteúdo interno do curso.

Posso ajudá-lo com conceitos, atividades, documentos ou trechos das apostilas relacionados ao seu curso do SENAI.

Se tiver dúvidas sobre automação, controladores, sensores, redes industriais, ou outros tópicos do curso, ficarei feliz em ajudar!`,
    out_of_scope: true,
    suggested_topics: [
      'Controladores Lógicos Programáveis (CLP)',
      'Sensores e Atuadores',
      'Redes Industriais',
      'Sistemas SCADA',
      'Pneumática e Hidráulica',
      'Segurança Industrial',
      'Instrumentação Industrial'
    ]
    ,
    
  };
};