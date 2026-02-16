const USER_KEY = 'senai_auth_user';

const canUseSessionStorage = () => typeof window !== 'undefined' && !!window.sessionStorage;

const normalizeUser = (user = {}) => ({
  userId: user?.userId || user?.user_id || user?.id || null,
  userName: user?.userName || user?.user_name || user?.name || user?.fullname || null,
  userEmail: user?.userEmail || user?.user_email || user?.email || null,
  isAdmin: !!(user?.isAdmin || user?.is_admin || user?.admin),
  fromMoodle: !!user?.fromMoodle,
});

export const storeAuthUser = (user) => {
  const normalized = normalizeUser(user);
  const hasIdentity = normalized.userId || normalized.userName || normalized.userEmail;
  if (!hasIdentity) return;

  if (canUseSessionStorage()) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(normalized));
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth_user_updated', { detail: normalized }));
  }
};

export const getAuthUser = () => {
  if (!canUseSessionStorage()) return null;

  const serialized = sessionStorage.getItem(USER_KEY);
  if (!serialized) return null;

  try {
    return normalizeUser(JSON.parse(serialized));
  } catch {
    return null;
  }
};

export const clearAuthUser = () => {
  if (canUseSessionStorage()) {
    sessionStorage.removeItem(USER_KEY);
  }
};
