import { useState } from 'react';
import { loginWithDevApiKey } from '../services/authService';

function DevLogin({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [devApiKey, setDevApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginWithDevApiKey({ email: email.trim(), devApiKey: devApiKey.trim() });
      const user = data?.user || {};
      onSuccess({
        userId: user.userId || user.user_id || user.id || email.trim(),
        userName: user.name || user.fullname || email.trim(),
        userEmail: user.email || email.trim(),
        fromMoodle: false,
      });
    } catch (err) {
      setError(err?.message || 'Nao foi possivel autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-lg font-semibold text-gray-800">Login de desenvolvimento</h1>
        <p className="text-sm text-gray-500">Use email e dev_api_key para acessar fora do Moodle.</p>

        <div>
          <label className="block text-sm text-gray-700 mb-1" htmlFor="dev-email">Email</label>
          <input
            id="dev-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1" htmlFor="dev-key">Dev API Key</label>
          <input
            id="dev-key"
            type="password"
            required
            value={devApiKey}
            onChange={(e) => setDevApiKey(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default DevLogin;
