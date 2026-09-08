'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { isLoggedIn } from '@/utils/authUtils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const RegistrationPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const requirements = [
    { text: "8+ characters", regex: /.{8,}/ },
    { text: "1 number", regex: /\d/ },
    { text: "1 uppercase", regex: /[A-Z]/ },
    { text: "1 special", regex: /[!@#$%^&*]/ }
  ];

  // Redirect if user is already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (formData.password && touchedFields.password) {
      setError('');
    }
  }, [formData.password, touchedFields.password]);

  const checkRequirement = (requirement: { regex: RegExp }) => {
    return requirement.regex.test(formData.password);
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = [];

    if (!formData.email) {
      newErrors.push('Email is required');
      valid = false;
    }
    if (!formData.password) {
      newErrors.push('Password is required');
      valid = false;
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match');
      valid = false;
    }
    if (!requirements.every(checkRequirement)) {
      newErrors.push('Please meet all password requirements');
      valid = false;
    }

    setError(newErrors.join('. '));
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signup/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
         },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('OTP sent! Check your email.');
        localStorage.setItem('registrationEmail', formData.email);
        setTimeout(() => router.push('/verify'), 1500);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = (field: keyof typeof touchedFields) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const passwordStrength = () => {
    const metRequirements = requirements.filter(checkRequirement).length;
    if (metRequirements === 4) return 'Strong';
    if (metRequirements >= 2) return 'Medium';
    return 'Weak';
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
            <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Start your journey with us
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-10 hover:bg-accent/90 transition-colors">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" className="h-10 hover:bg-accent/90 transition-colors">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.481C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  GitHub
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or register with email
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input
                    id="full-name"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onBlur={() => handleBlur('email')}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => {
                        setPasswordFocused(false);
                        handleBlur('password');
                      }}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-7 w-7 p-1 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {formData.password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Password strength:</span>
                        <span className={`text-sm font-medium ${
                          passwordStrength() === 'Weak' ? 'text-red-500' :
                          passwordStrength() === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          {passwordStrength()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {requirements.map((req, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            {checkRequirement(req) ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">{req.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      onBlur={() => handleBlur('confirmPassword')}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-7 w-7 p-1 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {touchedFields.confirmPassword && formData.confirmPassword && (
                    <span className={`text-sm mt-1 ${
                      formData.password === formData.confirmPassword ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  )}
                </div>
              </div>

              {(error || success) && (
                <Alert variant={error ? "destructive" : "default"} className="mt-4">
                  <AlertDescription>{error || success}</AlertDescription>
                </Alert>
              )}

              <div className="text-center text-sm text-muted-foreground">
                By registering, you agree to our{" "}
                <Link href="#" className="font-medium underline hover:text-primary">Terms</Link> and{" "}
                <Link href="#" className="font-medium underline hover:text-primary">Privacy Policy</Link>.
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full h-11 text-lg font-semibold transition-all" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Create Account'
                )}
              </Button>
            </CardFooter>
          </form>

          <div className="text-center text-sm mb-6">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in here
            </Link>
          </div>
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

export default RegistrationPage;