// Token management utilities for handling localStorage vs sessionStorage based on "Remember Me"

interface TokenData {
  accessToken: string;
  refreshToken: string;
  userEmail: string;
  userData?: any;
}

export const TokenManager = {
  // Store tokens based on remember me preference
  storeTokens: (tokens: TokenData, rememberMe: boolean = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem('accessToken', tokens.accessToken);
    storage.setItem('refreshToken', tokens.refreshToken);
    storage.setItem('userEmail', tokens.userEmail);
    
    if (tokens.userData) {
      storage.setItem('userData', JSON.stringify(tokens.userData));
    }
    
    // Store the remember me preference for future reference
    localStorage.setItem('rememberMe', rememberMe.toString());
    
    // Clear tokens from the other storage to avoid conflicts
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem('accessToken');
    otherStorage.removeItem('refreshToken');
    otherStorage.removeItem('userEmail');
    otherStorage.removeItem('userData');
  },

  // Get tokens from both storages (check localStorage first, then sessionStorage)
  getTokens: (): TokenData | null => {
    // First check localStorage
    let accessToken = localStorage.getItem('accessToken');
    let refreshToken = localStorage.getItem('refreshToken');
    let userEmail = localStorage.getItem('userEmail');
    let userData = localStorage.getItem('userData');
    
    // If not found in localStorage, check sessionStorage
    if (!accessToken) {
      accessToken = sessionStorage.getItem('accessToken');
      refreshToken = sessionStorage.getItem('refreshToken');
      userEmail = sessionStorage.getItem('userEmail');
      userData = sessionStorage.getItem('userData');
    }
    
    if (!accessToken || !refreshToken || !userEmail) {
      return null;
    }
    
    return {
      accessToken,
      refreshToken,
      userEmail,
      userData: userData ? JSON.parse(userData) : null
    };
  },

  // Get specific token
  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
  },

  getUserEmail: (): string | null => {
    return localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
  },

  // Update tokens in the same storage where they're currently stored
  updateTokens: (accessToken: string, refreshToken?: string) => {
    // Check which storage currently has the tokens
    const hasLocalStorage = !!localStorage.getItem('accessToken');
    const storage = hasLocalStorage ? localStorage : sessionStorage;
    
    storage.setItem('accessToken', accessToken);
    if (refreshToken) {
      storage.setItem('refreshToken', refreshToken);
    }
  },

  // Clear all tokens from both storages
  clearTokens: () => {
    // Clear from both storages
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userData');
    localStorage.removeItem('rememberMe');
    
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userData');
  },

  // Check if user had previously selected "Remember Me"
  getRememberMePreference: (): boolean => {
    return localStorage.getItem('rememberMe') === 'true';
  },

  // Check if tokens exist in any storage
  hasValidTokens: (): boolean => {
    const tokens = TokenManager.getTokens();
    return tokens !== null;
  }
};

export default TokenManager;
