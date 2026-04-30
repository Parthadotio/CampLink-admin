let userData = null;

export const saveUserData = (user, token) => {
  userData = { user, token };
  // Save full user data to localStorage for persistence across refresh
  localStorage.setItem('userData', JSON.stringify({ user, token }));
};

export const getUserData = () => {
  // If userData is in memory, return it
  if (userData) {
    return userData;
  }
  // If not in memory, try to get from localStorage (after refresh)
  const stored = localStorage.getItem('userData');
  if (stored) {
    userData = JSON.parse(stored);
    return userData;
  }
  return null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('userData');
};

export const clearUserData = () => {
  userData = null;
  localStorage.removeItem('userData');
};
