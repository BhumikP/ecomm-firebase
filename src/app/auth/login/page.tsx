
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        const userData = data.user;
        // The API now sets httpOnly cookies. We still set localStorage for client-side UI updates.
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userData', JSON.stringify(userData)); // Store full user data
        localStorage.setItem('userEmail', userData.email); // Store email for form pre-filling

        toast({
          title: "Login Successful",
          description: `Welcome back, ${userData.name}!`,
        });

        // Redirect based on role
        if (userData.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/'); // Redirect regular user to homepage
        }
        router.refresh(); // Force a refresh to update server-side state like the header
      } else {
        // Login failed
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: data.message || "Invalid email or password. Please try again.",
        });
      }
    } catch (error) {
      console.error('Login fetch error:', error);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                 <Label htmlFor="password">Password</Label>
                 <Link href="/auth/forgot-password" // TODO: Implement forgot password page
                     className="text-sm text-primary hover:underline">
                     Forgot password?
                 </Link>
               </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
               {isLoading ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Logging in...
                   </>
               ) : (
                 'Login'
               )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
           <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-primary hover:underline font-medium">
                    Register
                </Link>
            </p>
           {/* Remove mock login hints if desired
           <p className="text-sm text-muted-foreground">
                Admin login? use admin@example.com / password
            </p>
            */}
        </CardFooter>
      </Card>
    </div>
  );
}
