import { useState, useEffect } from 'react';
import {
  getMoodleTokenFromURL,
  validateMoodleSession,
  isFromMoodle,
  decodeMoodleToken,
  storeMoodleUser,
  getMoodleUser,
  refreshAccessTokenFromMoodle
} from '../services/moodleAuthService';

/**
 * Componente wrapper que valida a autenticação do Moodle
 * antes de renderizar o chat
 */
function MoodleAuthWrapper({ children }) {
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    user: null,
    error: null
  });

  useEffect(() => {
    const validateAuth = async () => {
      try {
        console.log('🔍 Iniciando validação de autenticação...');
        
        const fromMoodleRequest = isFromMoodle();

        // Verifica o modo de desenvolvimento primeiro
        const isDev = import.meta.env.DEV;
        console.log('🔍 Modo atual:', { isDev, mode: import.meta.env.MODE });

        if (isDev) {
          // Em desenvolvimento, sempre permite acesso
          console.log('⚠️ Modo desenvolvimento - criando usuário padrão');
          const devUser = { 
            userId: 'dev-user', 
            userName: 'Desenvolvedor', 
            fromMoodle: false 
          };
          
          storeMoodleUser(devUser);
          
          setAuthState({
            loading: false,
            authenticated: true,
            user: devUser,
            error: null
          });
          return;
        }

        // Fora do fluxo com moodle_token na URL, reaproveita usuário já autenticado
        const existingUser = getMoodleUser();
        if (!fromMoodleRequest && existingUser && (existingUser.userId || existingUser.userName || existingUser.userEmail)) {
          const isGuest = existingUser.userId === 'guest' || existingUser.fromMoodle === false;
          if (!isGuest || (window.__MOODLE_USER__ && window.__MOODLE_USER__.userId)) {
            console.log('✅ Usuário já autenticado encontrado:', existingUser);
            setAuthState({
              loading: false,
              authenticated: true,
              user: existingUser,
              error: null
            });
            return;
          }
        }

        // Verifica se veio do Moodle com token (apenas em produção)
        if (fromMoodleRequest) {
          const { token, origin, page } = getMoodleTokenFromURL();
          
          console.log('🔐 Token Moodle detectado, validando...');
          
          // Timeout para evitar travamento
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout na validação')), 10000)
          );
          
          let result = await Promise.race([
            validateMoodleSession(token, origin, page),
            timeoutPromise
          ]);

          if (!result?.ok) {
            const recovered = await refreshAccessTokenFromMoodle({
              allowParentTokenRequest: true,
              reloadOnFailure: true,
            });

            if (recovered) {
              let tokenForRetry = token;
              try {
                tokenForRetry = sessionStorage.getItem('moodle_token') || token;
              } catch (_error) {
                // noop
              }
              result = await validateMoodleSession(tokenForRetry, origin, page);
            }
          }
          
          if (result.ok) {
            const userData = {
              userId: result.userId,
              userName: result.userName,
              userEmail: result.userEmail,
              fromMoodle: true
            };
            
            storeMoodleUser(userData);
            
            setAuthState({
              loading: false,
              authenticated: true,
              user: userData,
              error: null
            });
            
            // Remove o token da URL por segurança
            const url = new URL(window.location);
            url.searchParams.delete('moodle_token');
            url.searchParams.delete('token');
            window.history.replaceState({}, '', url);
          } else {
            const decodedUser = decodeMoodleToken(token);
            const allowDecodedFallback =
              !(window.parent && window.parent !== window);

            if (allowDecodedFallback && decodedUser && decodedUser.userId) {
              console.warn('⚠️ Validação falhou, usando dados do token localmente.');
              storeMoodleUser(decodedUser);
              setAuthState({
                loading: false,
                authenticated: true,
                user: decodedUser,
                error: null
              });
            } else {
              console.error('❌ Falha na validação:', result.error);
              setAuthState({
                loading: false,
                authenticated: false,
                user: null,
                error: 'Sessão do Moodle expirada. Reabra o chat pelo Moodle.'
              });
            }
          }
        } else {
          // Em produção sem token Moodle
          console.log('🔒 Produção - autenticação Moodle obrigatória');
          setAuthState({
            loading: false,
            authenticated: false,
            user: null,
            error: 'Acesso não autorizado. Por favor, acesse através do Moodle.'
          });
        }
      } catch (error) {
        console.error('❌ Erro na validação de autenticação:', error);
        
        // Em caso de erro, permite acesso em desenvolvimento
        const isDev = import.meta.env.DEV;
        if (isDev) {
          console.log('⚠️ Erro na validação, permitindo acesso em desenvolvimento');
          const devUser = { 
            userId: 'dev-user', 
            userName: 'Desenvolvedor', 
            fromMoodle: false 
          };
          
          storeMoodleUser(devUser);
          
          setAuthState({
            loading: false,
            authenticated: true,
            user: devUser,
            error: null
          });
        } else {
          setAuthState({
            loading: false,
            authenticated: false,
            user: null,
            error: 'Erro na validação da sessão'
          });
        }
      }
    };

    // Adiciona um pequeno delay para evitar problemas de renderização
    const timeoutId = setTimeout(validateAuth, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      const data = event?.data;
      if (!data) return;
      if (data.type === 'senai_moodle_user' && data.payload) {
        storeMoodleUser(data.payload);
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          authenticated: true,
          user: data.payload,
          error: null
        }));
        return;
      }
      if (data.userId || data.userName || data.userEmail) {
        storeMoodleUser(data);
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          authenticated: true,
          user: data,
          error: null
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Loading state
  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Validando sessão...</p>
        </div>
      </div>
    );
  }

  // Error state - permite acesso sem bloqueio
  if (!authState.authenticated) {
    const { token } = getMoodleTokenFromURL();
    const existingUser = getMoodleUser();
    if (
      (existingUser &&
        (existingUser.userId || existingUser.userName || existingUser.userEmail) &&
        existingUser.userId !== 'guest') ||
      token
    ) {
      return children;
    }

    const shouldSetGuest = !(window.parent && window.parent !== window);
    if (shouldSetGuest) {
      const guestUser = {
        userId: 'guest',
        userName: 'Visitante',
        fromMoodle: false
      };
      storeMoodleUser(guestUser);
    }
    return children;
  }

// Authenticated - render children with user context
  return children;
}

export default MoodleAuthWrapper;
