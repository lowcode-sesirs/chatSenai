/**
 * Utilitário para verificar saúde do backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend-311313028224.southamerica-east1.run.app/api';

/**
 * Testa se o backend está respondendo
 * @returns {Promise<{isHealthy: boolean, status: number, message: string}>}
 */
export const checkBackendHealth = async () => {
  try {
    // Tenta fazer uma requisição simples para o backend
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/`, {
      method: 'GET',
      timeout: 5000 // 5 segundos de timeout
    });

    return {
      isHealthy: response.ok,
      status: response.status,
      message: response.ok ? 'Backend funcionando' : `Erro ${response.status}`
    };
  } catch (error) {
    return {
      isHealthy: false,
      status: 0,
      message: `Erro de conexão: ${error.message}`
    };
  }
};

/**
 * Testa especificamente o endpoint de chat
 * @returns {Promise<{isHealthy: boolean, status: number, message: string}>}
 */
export const checkChatEndpoint = async () => {
  try {
    // Tenta fazer uma requisição de teste (pode falhar por falta de dados, mas não deve dar 500)
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dev-user': 'health-check'
      },
      body: JSON.stringify({
        message: 'health check',
        course_external_id: 'test'
      })
    });

    // Qualquer resposta diferente de 500 indica que o endpoint está funcionando
    const isHealthy = response.status !== 500;
    
    return {
      isHealthy,
      status: response.status,
      message: isHealthy ? 'Endpoint de chat funcionando' : 'Erro 500 no endpoint de chat'
    };
  } catch (error) {
    return {
      isHealthy: false,
      status: 0,
      message: `Erro de conexão no chat: ${error.message}`
    };
  }
};

/**
 * Executa verificação completa de saúde
 * @returns {Promise<{backend: object, chat: object, overall: boolean}>}
 */
export const runHealthCheck = async () => {
  console.log('🔍 Executando verificação de saúde do backend...');
  
  const [backendHealth, chatHealth] = await Promise.all([
    checkBackendHealth(),
    checkChatEndpoint()
  ]);

  const overall = backendHealth.isHealthy && chatHealth.isHealthy;

  const result = {
    backend: backendHealth,
    chat: chatHealth,
    overall,
    timestamp: new Date().toISOString()
  };

  console.log('📊 Resultado da verificação de saúde:', result);
  
  return result;
};