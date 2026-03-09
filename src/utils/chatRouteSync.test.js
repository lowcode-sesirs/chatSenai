import { describe, expect, it } from 'vitest';
import { buildChatRoute, pickChatIdFromSearch } from './chatRouteSync';

describe('chatRouteSync', () => {
  it('gera rota com session_id/chat_id/active_chat_id para expandir conversa ativa', () => {
    const route = buildChatRoute(
      'https://senai-assistente-dev.web.app/?moodle_token=abc&origin=moodle',
      '123-session'
    );

    expect(route).toContain('moodle_token=abc');
    expect(route).toContain('origin=moodle');
    expect(route).toContain('active_chat_id=123-session');
    expect(route).toContain('chat_id=123-session');
    expect(route).toContain('session_id=123-session');
  });

  it('limpa ids antigos quando chatId nulo', () => {
    const route = buildChatRoute(
      'https://senai-assistente-dev.web.app/?active_chat_id=a&chat_id=a&session_id=a&sid=a&moodle_token=abc',
      null
    );

    expect(route).toContain('moodle_token=abc');
    expect(route).not.toContain('active_chat_id=');
    expect(route).not.toContain('chat_id=');
    expect(route).not.toContain('session_id=');
    expect(route).not.toContain('sid=');
  });

  it('prioriza active_chat_id ao ler query string', () => {
    const chatId = pickChatIdFromSearch('?active_chat_id=a1&chat_id=b2&session_id=c3');
    expect(chatId).toBe('a1');
  });
});
