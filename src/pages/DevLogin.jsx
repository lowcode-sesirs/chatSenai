import { useState } from 'react';
import { DEV_LOGIN_ENABLED, devLogin } from '../services/authService';

function DevLogin() {
  const [email, setEmail] = useState('');
  const [devApiKey, setDevApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await devLogin({ email, devApiKey });
      window.location.href = '/';
    } catch (err) {
      setError(err?.body ? JSON.stringify(err.body, null, 2) : err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!DEV_LOGIN_ENABLED) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow">
          <h1 className="text-xl font-semibold text-gray-900">Dev Login desabilitado</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure <code>VITE_ENABLE_DEV_LOGIN=true</code> para habilitar este fluxo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow">
        <h1 className="text-xl font-semibold text-gray-900">Dev Login</h1>
        <p className="mt-2 text-sm text-gray-600">
          Uso somente em ambiente dev/staging.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
              placeholder="usuario@empresa.com"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="devApiKey" className="mb-1 block text-sm font-medium text-gray-700">
              Dev API Key
            </label>
            <input
              id="devApiKey"
              type="password"
              value={devApiKey}
              onChange={(event) => setDevApiKey(event.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
              placeholder="chave de desenvolvimento"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {error ? (
          <pre className="mt-4 overflow-auto rounded-md bg-red-50 p-3 text-xs text-red-700">{error}</pre>
        ) : null}
      </div>
    </div>
  );
}

export default DevLogin;
