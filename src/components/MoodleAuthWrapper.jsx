import { useEffect, useState } from 'react';
import DevLogin from '../pages/DevLogin';
import {
  decodeMoodleToken,
  getMoodleTokenFromURL,
  getMoodleUser,
  isFromMoodle,
  storeMoodleUser,
  validateMoodleSession,
} from '../services/moodleAuthService';
import { getToken } from '../services/tokenStore';

const isDevLoginEnabled = String(import.meta.env.VITE_ENABLE_DEV_LOGIN || '').toLowerCase() === 'true';

function MoodleAuthWrapper({ children }) {
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    user: null,
    error: null,
  });

  useEffect(() => {
    const ensureAccessToken = async () => {
      if (getToken()) return true;
      const { token, origin, page } = getMoodleTokenFromURL();
      if (!token) return false;
      const result = await validateMoodleSession(token, origin, page);
      return !!(result?.ok && getToken());
    };

    const validateAuth = async () => {
      try {
        console.log('Iniciando validacao de autenticacao...');

        // Persist moodle_token when present in URL.
        const tokenInfo = getMoodleTokenFromURL();
        const isEmbedded = window.parent && window.parent !== window;

        // In iframe mode, só faz exchange se ainda não houver access_token.
        // Isso evita derrubar uma sessão válida quando o moodle_token curto já expirou.
        if (isEmbedded && tokenInfo?.token && !getToken()) {
          await validateMoodleSession(tokenInfo.token, tokenInfo.origin, tokenInfo.page);
        }

        const existingUser = getMoodleUser();
        if (existingUser && (existingUser.userId || existingUser.userName || existingUser.userEmail)) {
          const hasAccessToken = await ensureAccessToken();
          if (hasAccessToken || import.meta.env.DEV) {
            const isGuest = existingUser.userId === 'guest' || existingUser.fromMoodle === false;
            if (!isGuest || (window.__MOODLE_USER__ && window.__MOODLE_USER__.userId)) {
              setAuthState({
                loading: false,
                authenticated: true,
                user: existingUser,
                error: null,
              });
              return;
            }
          }
        }

        const isDev = import.meta.env.DEV;
        if (isDev) {
          const devUser = {
            userId: 'dev-user',
            userName: 'Desenvolvedor',
            fromMoodle: false,
          };
          storeMoodleUser(devUser);
          setAuthState({
            loading: false,
            authenticated: true,
            user: devUser,
            error: null,
          });
          return;
        }

        if (isFromMoodle()) {
          const { token, origin, page } = getMoodleTokenFromURL();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout na validacao')), 10000)
          );

          const result = await Promise.race([
            validateMoodleSession(token, origin, page),
            timeoutPromise,
          ]);

          if (result?.ok) {
            const userData = {
              userId: result.userId,
              userName: result.userName,
              userEmail: result.userEmail,
              fromMoodle: true,
            };
            storeMoodleUser(userData);
            setAuthState({
              loading: false,
              authenticated: true,
              user: userData,
              error: null,
            });

            // Keep moodle_token in iframe context (helps fresh loads in embedded mode).
            const isEmbedded = window.parent && window.parent !== window;
            if (!isEmbedded) {
              const url = new URL(window.location.href);
              url.searchParams.delete('moodle_token');
              url.searchParams.delete('token');
              window.history.replaceState({}, '', url.toString());
            }
            return;
          }

          const decodedUser = decodeMoodleToken(token);
          if (decodedUser?.userId) {
            // Não autentica apenas com token decodificado: /chat/* exige access_token real.
            storeMoodleUser(decodedUser);
          }
        }

        setAuthState({
          loading: false,
          authenticated: false,
          user: null,
          error: 'Acesso nao autorizado. Acesse via Moodle.',
        });
      } catch (error) {
        console.error('Erro na validacao de autenticacao:', error);
        if (import.meta.env.DEV) {
          const devUser = {
            userId: 'dev-user',
            userName: 'Desenvolvedor',
            fromMoodle: false,
          };
          storeMoodleUser(devUser);
          setAuthState({
            loading: false,
            authenticated: true,
            user: devUser,
            error: null,
          });
          return;
        }

        setAuthState({
          loading: false,
          authenticated: false,
          user: null,
          error: 'Erro na validacao da sessao',
        });
      }
    };

    const timeoutId = setTimeout(validateAuth, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const handleMessage = async (event) => {
      const data = event?.data;
      if (!data) return;

      const payload =
        data.type === 'senai_moodle_user' && data.payload ? data.payload : data;

      const incomingToken = payload?.moodle_token || payload?.token || null;
      if (incomingToken) {
        try {
          sessionStorage.setItem('moodle_token', incomingToken);
          localStorage.setItem('moodle_token', incomingToken);
        } catch (_error) {
          // noop
        }
        await validateMoodleSession(incomingToken, 'moodle', 'chat').catch(() => {});
      }

      if (!(payload.userId || payload.userName || payload.userEmail)) return;

      storeMoodleUser(payload);

      if (!getToken()) {
        await validateMoodleSession(
          payload.moodle_token || payload.token || getMoodleTokenFromURL().token,
          'moodle',
          'chat'
        ).catch(() => {});
      }

      setAuthState((prev) => ({
        ...prev,
        loading: false,
        authenticated: true,
        user: payload,
        error: null,
      }));
    };

    window.addEventListener('message', handleMessage);
    let intervalId = null;
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'senai_request_moodle_user' }, '*');
        window.parent.postMessage({ type: 'senai_request_moodle_token' }, '*');
        // Reforça a solicitação por alguns segundos para lidar com carregamento assíncrono do Moodle.
        intervalId = window.setInterval(() => {
          if (getToken()) {
            window.clearInterval(intervalId);
            return;
          }
          window.parent.postMessage({ type: 'senai_request_moodle_user' }, '*');
          window.parent.postMessage({ type: 'senai_request_moodle_token' }, '*');
        }, 2000);
        window.setTimeout(() => {
          if (intervalId) {
            window.clearInterval(intervalId);
          }
        }, 15000);
      }
    } catch (error) {
      console.warn('Falha ao solicitar moodle_user via postMessage:', error);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Validando sessao...</p>
        </div>
      </div>
    );
  }


  if (!authState.authenticated) {
    const existingUser = getMoodleUser();
    const hasAccessToken = !!getToken();
    const { token: moodleToken } = getMoodleTokenFromURL();
    const isEmbedded = window.parent && window.parent !== window;
    if (
      hasAccessToken &&
      existingUser &&
      (existingUser.userId || existingUser.userName || existingUser.userEmail) &&
      existingUser.userId !== 'guest'
    ) {
      return children;
    }

    if (isEmbedded) {
      if (moodleToken) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-3" />
              <p className="text-gray-600">Sincronizando sessao do Moodle...</p>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center max-w-sm">
            <p className="text-gray-700 font-medium">Sessao do Moodle indisponivel.</p>
            <p className="text-gray-500 text-sm mt-1">Reabra o chat pelo Moodle para gerar um novo token.</p>
          </div>
        </div>
      );
    }

    if (isDevLoginEnabled) {
      return (
        <DevLogin
          onSuccess={(userData) => {
            storeMoodleUser(userData);
            setAuthState({
              loading: false,
              authenticated: true,
              user: userData,
              error: null,
            });
          }}
        />
      );
    }

    storeMoodleUser({
      userId: 'guest',
      userName: 'Visitante',
      fromMoodle: false,
    });
    return children;
  }

  return children;
}

export default MoodleAuthWrapper;
