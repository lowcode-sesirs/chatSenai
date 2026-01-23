import { useState, useEffect } from 'react';
import {
  getMoodleTokenFromURL,
  validateMoodleSession,
  isFromMoodle,
  storeMoodleUser,
  getMoodleUser
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
        
        // Verifica se já tem usuário autenticado na sessão
        const existingUser = getMoodleUser();
        if (existingUser) {
          console.log('✅ Usuário já autenticado encontrado:', existingUser);
          setAuthState({
            loading: false,
            authenticated: true,
            user: existingUser,
            error: null
          });
          return;
        }

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

        // Verifica se veio do Moodle com token (apenas em produção)
        if (isFromMoodle()) {
          const { token, origin, page } = getMoodleTokenFromURL();
          
          console.log('🔐 Token Moodle detectado, validando...');
          
          // Timeout para evitar travamento
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout na validação')), 10000)
          );
          
          const result = await Promise.race([
            validateMoodleSession(token, origin, page),
            timeoutPromise
          ]);
          
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
            console.error('❌ Falha na validação:', result.error);
            setAuthState({
              loading: false,
              authenticated: false,
              user: null,
              error: result.error || 'Sessão inválida'
            });
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

  // Error state
  if (!authState.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">{authState.error}</p>
          <p className="text-sm text-gray-500">
            Se você é um aluno, acesse o chat através da plataforma Moodle.
          </p>
        </div>
      </div>
    );
  }

  // Authenticated - render children with user context
  return children;
}

export default MoodleAuthWrapper;
