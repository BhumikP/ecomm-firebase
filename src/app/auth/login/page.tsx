'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react'; // Import Loader2

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Attempting login with:', { email, password });

    // --- Mock Login Logic ---
    // Replace this with your actual Firebase or backend authentication call
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    // Example: Simple check (replace with real auth)
    if (email === 'admin@example.com' && password === 'password') {
      // Simulate successful admin login
       localStorage.setItem('userRole', 'admin'); // Store role (use more secure method in production)
       localStorage.setItem('isLoggedIn', 'true');
      toast({
        title: "Login Successful",
        description: "Welcome back, Admin!",
      });
      router.push('/admin'); // Redirect admin
    } else if (email === 'user@example.com' && password === 'password') {
        // Simulate successful user login
        localStorage.setItem('userRole', 'user'); // Store role
        localStorage.setItem('isLoggedIn', 'true');
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push('/'); // Redirect regular user
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
      });
    }
    // --- End Mock Login Logic ---

    setIsLoading(false);
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
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                 <Label htmlFor="password">Password</Label>
                 <Link href="/auth/forgot-password" // Add this link later
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
           <p className="text-sm text-muted-foreground">
                Admin login? Use admin@example.com / password
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
