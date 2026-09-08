'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';
import { isLoggedIn } from '@/utils/authUtils';
import { useRouter } from 'next/navigation';

const ResetPasswordPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    resetToken: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });

  // Redirect if user is already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    // Retrieve stored email and resetToken
    const email = sessionStorage.getItem('resetEmail');
    const resetToken = sessionStorage.getItem('resetToken');
    
    if (!email || !resetToken) {
      router.push('/forgot-password');
      return;
    }

    setFormData(prev => ({
      ...prev,
      email,
      resetToken
    }));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/resetPassword/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Clear stored reset data
        sessionStorage.removeItem('resetToken');
        sessionStorage.removeItem('resetEmail');
        
        // Redirect to login
        router.push('/login');
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

   return (
     <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
       {/* Cyber Security Background Elements */}
       <div className="fixed inset-0 z-0">
         {/* Animated Binary Code Stream */}
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent opacity-20 animate-scroll"></div>
 
         {/* Floating Hexagons */}
         {Array.from({ length: 15 }).map((_, i) => (
           <div
             key={`hex-${i}`}
             className="absolute border-2 border-primary/20 w-12 h-14 clip-hexagon"
             style={{
               left: `${Math.random() * 100}%`,
               top: `${Math.random() * 100}%`,
               animation: `float ${15 + i % 5}s infinite linear`,
             }}
           />
         ))}
 
         {/* Glowing Orbs */}
         <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-3000"></div>
 
         {/* Grid Background */}
         <div className="absolute inset-0 bg-grid-small-white/5"></div>
 
         {/* Floating Particles */}
         {Array.from({ length: 50 }).map((_, i) => (
           <div
             key={`particle-${i}`}
             className="absolute w-0.5 h-0.5 bg-primary/40 rounded-full"
             style={{
               left: `${Math.random() * 100}%`,
               top: `${Math.random() * 100}%`,
               animation: `particle ${10 + (i % 10)}s linear infinite`,
             }}
           />
         ))}
       </div>
       <div className="w-full max-w-md relative z-10">
         <Card className="shadow-lg bg-background/90 backdrop-blur-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Enter your new password and OTP
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter OTP"
                  value={formData.otp}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Back to Login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      <style jsx global>{`
        @keyframes scroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 100vh; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20vh) rotate(180deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }

        @keyframes particle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(calc(-50vw + (var(--x) * 100vw))); opacity: 0; }
        }

        .clip-hexagon {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }

        .bg-grid-small-white/5 {
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0);
          background-size: 40px 40px;
        }

        .animate-scroll {
          animation: scroll 120s linear infinite;
        }

        .animate-pulse {
          animation: pulse 8s ease-in-out infinite;
        }

        .delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
    </div>
  );
};

export default ResetPasswordPage;