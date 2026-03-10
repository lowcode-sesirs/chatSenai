import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const DEFAULT_MOODLE_PARENT_ORIGIN = "https://pocsesi-rs.asdnet.com.br";

const buildCurrentRoute = (location) =>
  `${location.pathname}${location.search}${location.hash}`;

const getMoodleTokenForRoute = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("moodle_token") ||
      params.get("token") ||
      sessionStorage.getItem("moodle_token") ||
      localStorage.getItem("moodle_token") ||
      null
    );
  } catch (_error) {
    return null;
  }
};

const ensureRouteHasMoodleToken = (route) => {
  if (typeof window === "undefined") return route;
  const token = getMoodleTokenForRoute();
  if (!token) return route;

  try {
    const parsed = new URL(route, window.location.origin);
    if (!parsed.searchParams.get("moodle_token") && !parsed.searchParams.get("token")) {
      parsed.searchParams.set("moodle_token", token);
    }
    if (!parsed.searchParams.get("origin")) {
      parsed.searchParams.set("origin", "moodle");
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash || ""}`;
  } catch (_error) {
    return route;
  }
};

const notifyParentRoute = (route, targetOrigin) => {
  if (typeof window === "undefined") return;
  if (!window.parent || window.parent === window) return;
  const safeRoute = ensureRouteHasMoodleToken(route);

  window.parent.postMessage(
    {
      type: "CHAT_ROUTE_UPDATE",
      route: safeRoute,
    },
    targetOrigin
  );
};

const getBestActiveChatId = () => {
  try {
    return (
      localStorage.getItem("pendingExpandChatId") ||
      localStorage.getItem("activeChatId") ||
      null
    );
  } catch (_error) {
    return null;
  }
};

export const useMoodleBridge = ({ moodleOrigin, onChatExpanded } = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const targetOrigin = moodleOrigin || DEFAULT_MOODLE_PARENT_ORIGIN;
  const currentRoute = buildCurrentRoute(location);

  useEffect(() => {
    notifyParentRoute(currentRoute, targetOrigin);
  }, [currentRoute, targetOrigin]);

  useEffect(() => {
    const handleMessage = (event) => {
      const data = event?.data;
      const isTrustedOrigin = event.origin === targetOrigin;

      if (data?.type === "CHAT_EXPANDED" && isTrustedOrigin) {
        if (typeof onChatExpanded === "function") {
          onChatExpanded();
        }
        return;
      }

      if (!data || data.type !== "MOODLE_CHAT_EXPAND_CLICKED" || !isTrustedOrigin) return;
      console.log("MOODLE_CHAT_EXPAND_CLICKED recebido:", data);

      const expandedUrl = data?.expandedUrl;
      if (!expandedUrl || typeof expandedUrl !== "string") {
        const chatId = getBestActiveChatId();
        if (!chatId) return;
        const fallbackRoute = `/?active_chat_id=${chatId}&chat_id=${chatId}&session_id=${chatId}`;
        if (fallbackRoute !== currentRoute) {
          navigate(fallbackRoute, { replace: true });
        }
        return;
      }

      try {
        const parsed = new URL(expandedUrl, window.location.origin);
        const params = new URLSearchParams(parsed.search);
        const chatIdFromUrl =
          params.get("active_chat_id") || params.get("chat_id") || params.get("session_id");
        const chatId = chatIdFromUrl || getBestActiveChatId();
        if (chatId) {
          params.set("active_chat_id", chatId);
          params.set("chat_id", chatId);
          params.set("session_id", chatId);
        }
        const search = params.toString();
        const nextRoute = `${parsed.pathname}${search ? `?${search}` : ""}${parsed.hash}`;
        if (nextRoute && nextRoute !== currentRoute) {
          navigate(nextRoute, { replace: true });
        }
      } catch (error) {
        console.warn("Nao foi possivel aplicar expandedUrl recebido do Moodle:", error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentRoute, navigate, onChatExpanded, targetOrigin]);
};

export default useMoodleBridge;
