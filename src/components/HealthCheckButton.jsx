import { useState } from 'react';
import { runHealthCheck } from '../utils/healthCheck';

/**
 * Botão para testar a saúde do backend
 */
function HealthCheckButton({ onHealthChange }) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleHealthCheck = async () => {
    setIsChecking(true);
    
    try {
      const result = await runHealthCheck();
      setLastResult(result);
      
      if (onHealthChange) {
        onHealthChange(result);
      }
    } catch (error) {
      console.error('Erro na verificação de saúde:', error);
      setLastResult({
        overall: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = () => {
    if (!lastResult) return 'bg-gray-500';
    return lastResult.overall ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = () => {
    if (isChecking) return 'Testando...';
    if (!lastResult) return 'Testar Conexão';
    return lastResult.overall ? 'Sistema OK' : 'Sistema com Problemas';
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={handleHealthCheck}
        disabled={isChecking}
        className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
          isChecking 
            ? 'bg-gray-400 cursor-not-allowed' 
            : `${getStatusColor()} hover:opacity-80`
        }`}
      >
        {isChecking && (
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
        )}
        {getStatusText()}
      </button>

      {lastResult && !isChecking && (
        <div className="text-xs text-gray-600 text-center max-w-xs">
          <div className="mb-1">
            <strong>Backend:</strong> {lastResult.backend?.message || 'N/A'}
          </div>
          <div className="mb-1">
            <strong>Chat:</strong> {lastResult.chat?.message || 'N/A'}
          </div>
          <div className="text-gray-500">
            Testado às {new Date(lastResult.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthCheckButton;