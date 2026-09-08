'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, LogIn } from 'lucide-react';

interface AuthExpiredModalProps {
  isOpen: boolean;
  onClose?: () => void;
  reason?: 'expired' | 'invalid' | 'missing';
  title?: string;
  description?: string;
}

const AuthExpiredModal = ({ 
  isOpen, 
  onClose, 
  reason = 'expired',
  title,
  description 
}: AuthExpiredModalProps) => {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  const handleSignIn = () => {
    // Store the current URL for redirect after login
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/login' && currentPath !== '/register') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
    }
    onClose?.();
    router.push('/login');
  };

  const getModalContent = () => {
    switch (reason) {
      case 'expired':
        return {
          title: title || 'Session Expired',
          description: description || 'Your session has expired for security reasons. Please sign in again to continue.',
          icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
        };
      case 'invalid':
        return {
          title: title || 'Authentication Error',
          description: description || 'Your authentication credentials are invalid. Please sign in again.',
          icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
        };
      case 'missing':
        return {
          title: title || 'Authentication Required',
          description: description || 'You need to sign in to access this page.',
          icon: <LogIn className="h-12 w-12 text-blue-500" />,
        };
      default:
        return {
          title: 'Authentication Required',
          description: 'Please sign in to continue.',
          icon: <LogIn className="h-12 w-12 text-blue-500" />,
        };
    }
  };

  if (!mounted || !isOpen) return null;

  const { title: modalTitle, description: modalDescription, icon } = getModalContent();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Blur backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-2xl border-2 animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {icon}
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">
            {modalTitle}
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            {modalDescription}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            onClick={handleSignIn}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 transition-all duration-200 hover:scale-[1.02]"
            size="lg"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
          
          {onClose && (
            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthExpiredModal;
