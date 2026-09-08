'use client';
import { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import AuthExpiredModal from "@/components/AuthExpiredModal";
import TokenManager from './tokenManager';

// JWT Token validation utility
const isTokenExpired = (token: string): boolean => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    const currentTime = Date.now() / 1000;
    
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    return true; // If we can't parse it, consider it expired
  }
};

// Token validation with API call
const validateTokenWithAPI = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/validate-token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ token }),
    });

    if (response.status === 401 || response.status === 403) {
      return false;
    }

    return response.ok;
  } catch (error) {
    console.error('API token validation error:', error);
    return false; // If API is down, consider token invalid for security
  }
};

// Token refresh utility
const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    return data.access || null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
};

// Clear all authentication data using TokenManager
const clearAuthData = () => {
  TokenManager.clearTokens();
};

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const AuthComponent = (props: P) => {
    const [isClient, setIsClient] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalReason, setAuthModalReason] = useState<'expired' | 'invalid' | 'missing'>('expired');
    const router = useRouter();

    const handleAuthenticationFailure = useCallback((reason: 'expired' | 'invalid' | 'missing', showModal = true) => {
      clearAuthData();
      setIsAuthenticated(false);
      
      // Store the current URL for redirect after login
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath !== '/login' && currentPath !== '/register') {
          sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
      }
      
      if (showModal) {
        setAuthModalReason(reason);
        setShowAuthModal(true);
      } else {
        // Direct redirect without modal for missing token on initial load
        router.push("/login");
      }
    }, [router]);

    const handleModalClose = useCallback(() => {
      setShowAuthModal(false);
      router.push("/login");
    }, [router]);

    const validateAuthentication = useCallback(async () => {
      if (typeof window === "undefined") return false;

      const accessToken = TokenManager.getAccessToken();
      const refreshToken = TokenManager.getRefreshToken();

      // No tokens present
      if (!accessToken) {
        handleAuthenticationFailure('missing', false);
        return false;
      }

      // Check if token is expired (JWT validation)
      if (isTokenExpired(accessToken)) {
        console.log('Access token expired, attempting refresh...');
        
        if (!refreshToken) {
          handleAuthenticationFailure('expired');
          return false;
        }

        // Check if refresh token is expired
        if (isTokenExpired(refreshToken)) {
          handleAuthenticationFailure('expired');
          return false;
        }

        // Try to refresh the token
        const newAccessToken = await refreshAccessToken(refreshToken);
        if (newAccessToken) {
          TokenManager.updateTokens(newAccessToken);
          console.log('Token refreshed successfully');
          
          // Validate the new token with API
          const isValid = await validateTokenWithAPI(newAccessToken);
          if (!isValid) {
            handleAuthenticationFailure('invalid');
            return false;
          }
          
          return true;
        } else {
          handleAuthenticationFailure('expired');
          return false;
        }
      }

      // Validate token with API (additional security check)
      const isValid = await validateTokenWithAPI(accessToken);
      if (!isValid) {
        handleAuthenticationFailure('invalid');
        return false;
      }

      return true;
    }, [handleAuthenticationFailure]);

    useEffect(() => {
      setIsClient(true);
    }, []);

    useEffect(() => {
      if (!isClient) return;

      const checkAuth = async () => {
        setIsLoading(true);
        const isValid = await validateAuthentication();
        setIsAuthenticated(isValid);
        setIsLoading(false);
      };

      checkAuth();
    }, [isClient, validateAuthentication]);

    // Set up periodic token validation (every 5 minutes)
    useEffect(() => {
      if (!isClient || !isAuthenticated) return;

      const interval = setInterval(async () => {
        const accessToken = TokenManager.getAccessToken();
        if (accessToken && isTokenExpired(accessToken)) {
          console.log('Token expired during session, revalidating...');
          const isValid = await validateAuthentication();
          if (!isValid) {
            setIsAuthenticated(false);
          }
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      return () => clearInterval(interval);
    }, [isClient, isAuthenticated, validateAuthentication]);

    // Handle visibility change to check auth when user returns to tab
    useEffect(() => {
      if (!isClient || !isAuthenticated) return;

      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
          const accessToken = TokenManager.getAccessToken();
          if (accessToken && isTokenExpired(accessToken)) {
            console.log('Token expired while tab was hidden, revalidating...');
            const isValid = await validateAuthentication();
            if (!isValid) {
              setIsAuthenticated(false);
            }
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isClient, isAuthenticated, validateAuthentication]);

    // Show loading state while checking authentication
    if (!isClient || isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Verifying authentication...</p>
          </div>
        </div>
      );
    }

    // Don't render component if not authenticated
    if (!isAuthenticated) {
      return (
        <>
          <AuthExpiredModal
            isOpen={showAuthModal}
            onClose={handleModalClose}
            reason={authModalReason}
          />
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-pulse h-8 w-8 bg-muted rounded-full"></div>
              <p className="text-sm text-muted-foreground">Redirecting to login...</p>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <AuthExpiredModal
          isOpen={showAuthModal}
          onClose={handleModalClose}
          reason={authModalReason}
        />
        <WrappedComponent {...props} />
      </>
    );
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;
