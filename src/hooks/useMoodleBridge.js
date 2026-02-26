import { useEffect } from 'react';

export default function useMoodleBridge({ moodleOrigin, onChatExpanded }) {
  useEffect(() => {
    if (!moodleOrigin || typeof onChatExpanded !== 'function') {
      return undefined;
    }

    const handleMessage = (event) => {
      if (event.origin !== moodleOrigin) return;

      const data = event?.data;
      if (!data || data.type !== 'CHAT_EXPANDED') return;

      onChatExpanded();
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [moodleOrigin, onChatExpanded]);
}

