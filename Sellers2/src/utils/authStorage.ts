export const getAuthToken = (): string => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('token') || localStorage.getItem('token') || '';
};

export const getAuthUser = (): any => {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
