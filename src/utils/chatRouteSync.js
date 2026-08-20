export const CHAT_ROUTE_ID_KEYS = ['active_chat_id', 'chat_id', 'session_id', 'sid'];

export const pickChatIdFromSearch = (search = '') => {
  const params = new URLSearchParams(search || '');
  for (const key of CHAT_ROUTE_ID_KEYS) {
    const value = params.get(key);
    if (value) return value;
  }
  return null;
};

export const buildChatRoute = (href, chatId, { isDraft = false } = {}) => {
  const url = new URL(href);

  if (chatId) {
    url.searchParams.set('active_chat_id', chatId);
    url.searchParams.set('chat_id', chatId);
    url.searchParams.set('session_id', chatId);
  } else {
    url.searchParams.delete('active_chat_id');
    url.searchParams.delete('chat_id');
    url.searchParams.delete('session_id');
  }

  url.searchParams.delete('sid');

  if (isDraft) {
    url.searchParams.set('active_chat_draft', '1');
  } else {
    url.searchParams.delete('active_chat_draft');
  }

  return `${url.pathname}${url.search}${url.hash || ''}`;
};
