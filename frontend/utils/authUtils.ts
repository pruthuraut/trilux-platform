import TokenManager from './tokenManager';

// Logout utility that properly clears tokens and redirects
export const logout = () => {
  // Clear all tokens from both storages
  TokenManager.clearTokens();
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// Check if user is logged in
export const isLoggedIn = (): boolean => {
  return TokenManager.hasValidTokens();
};

// Get current user email
export const getCurrentUserEmail = (): string | null => {
  return TokenManager.getUserEmail();
};

// Get access token for API calls
export const getAccessTokenForAPI = (): string | null => {
  return TokenManager.getAccessToken();
};

// Redirect to login page with return URL stored
export const redirectToLogin = (router: { push: (url: string) => void }) => {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/login' && currentPath !== '/register') {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }
  }
  router.push('/login');
};

const authUtils = {
  logout,
  isLoggedIn,
  getCurrentUserEmail,
  getAccessTokenForAPI,
  redirectToLogin
};

export default authUtils;
