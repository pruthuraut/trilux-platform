'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const VerifyOTPPage = () => {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    // Get email from localStorage or URL params
    const userEmail = localStorage.getItem('registrationEmail');
    if (userEmail) {
      setEmail(userEmail);
    }

    // Start countdown timer
    const countdown = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 0) {
          clearInterval(countdown);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple digits in one input

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: { preventDefault: () => void; clipboardData: { getData: (arg0: string) => string; }; }) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    pastedData.forEach((value, index) => {
      if (index < 6 && /\d/.test(value)) {
        newOtp[index] = value;
      }
    });
    setOtp(newOtp);
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }
  
    setLoading(true);
    try {
      // Create and log the exact payload
      const payload = {
        email: email.trim(),
        otp: otpValue  // Send as string instead of parseInt
      };
      console.log("Sending verification payload:", payload);
  
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verifyOTP/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload)
      });
  
      console.log("Full Response:", response);
      const data = await response.json();
      console.log("Response Data:", data);
  
      if (response.ok) {
        setSuccess('OTP verified successfully!');
        localStorage.removeItem('registrationEmail');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        // Show more detailed error message
        setError(data.message || 'Invalid OTP. Please double-check and try again.');
        
        // Clear OTP fields on error
        setOtp(['', '', '', '', '', '']);
        // Focus first input
        const firstInput = document.getElementById('otp-0');
        if (firstInput) firstInput.focus();
      }
    } catch (err) {
      console.error("Verification Error:", err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  const handleResendOTP = async () => {
    // Implement resend OTP logic here
    setTimer(300); // Reset timer to 5 minutes
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
            <CardTitle className="text-2xl font-bold text-center">Verify Your Email</CardTitle>
            <CardDescription className="text-center">
              <p>Don&apos;t forget to verify your email!</p><br />

              <span className="font-medium">{email}</span>
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Enter verification code</Label>
                <div className="flex gap-2 justify-between">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="\d"
                      maxLength={1}
                      className="w-12 h-12 text-center text-lg"
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      required
                    />
                  ))}
                </div>
              </div>

              <div className="text-center text-sm">
                {timer > 0 ? (
                  <p className="text-muted-foreground">
                    Code expires in {formatTime(timer)}
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto font-normal"
                    onClick={handleResendOTP}
                    disabled={loading}
                  >
                    Resend verification code
                  </Button>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify Email"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="text-sm"
                onClick={() => router.push('/register')}  // This uses the router from useRouter hook
              >
                Use a different email address
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

export default VerifyOTPPage;