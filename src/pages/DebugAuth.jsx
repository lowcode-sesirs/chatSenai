import { useState } from 'react';
import { apiFetch, API_BASE_URL } from '../services/apiClient';
import { clearToken, getToken, setToken } from '../services/tokenStore';

function DebugAuth() {
  const [tokenInput, setTokenInput] = useState(getToken() || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSaveToken = () => {
    setToken(tokenInput.trim());
    setResult({ message: 'Token salvo em sessionStorage.' });
    setError('');
  };

  const handleClearToken = () => {
    clearToken();
    setTokenInput('');
    setResult({ message: 'Token removido.' });
    setError('');
  };

  const handleWhoAmI = async () => {
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await apiFetch('/auth/whoami', { method: 'GET' });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err?.body ? JSON.stringify(err.body, null, 2) : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow">
        <h1 className="text-xl font-semibold text-gray-900">Debug Auth</h1>
        <p className="mt-2 text-sm text-gray-600">
          API base atual: <code>{API_BASE_URL || '(nao configurada)'}</code>
        </p>

        <div className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-gray-700" htmlFor="token">
            Access token
          </label>
          <textarea
            id="token"
            className="w-full rounded-md border border-gray-300 p-2 text-sm"
            rows={4}
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder="Cole o access_token aqui"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveToken}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            Salvar token
          </button>
          <button
            type="button"
            onClick={handleClearToken}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Limpar token
          </button>
          <button
            type="button"
            onClick={handleWhoAmI}
            disabled={loading}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? 'Consultando...' : 'Testar /auth/whoami'}
          </button>
        </div>

        {error ? (
          <pre className="mt-4 overflow-auto rounded-md bg-red-50 p-3 text-xs text-red-700">{error}</pre>
        ) : null}

        {result ? (
          <pre className="mt-4 overflow-auto rounded-md bg-gray-100 p-3 text-xs text-gray-900">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

export default DebugAuth;
