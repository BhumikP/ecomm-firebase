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

function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Passwords do not match.",
      });
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
         toast({
             variant: "destructive",
             title: "Registration Failed",
             description: "Password must be at least 6 characters long.",
         });
         setIsLoading(false);
         return;
    }


    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) { // Checks for 2xx status codes (e.g., 201 Created)
        // Registration successful
        const userData = data.user;

        // Automatically log user in by setting cookies and local storage
        setCookie('isLoggedIn', 'true', 7);
        setCookie('userRole', userData.role, 7);
        localStorage.setItem('userData', JSON.stringify(userData));

        toast({
          title: "Registration Successful",
          description: "Your account has been created. Welcome!",
        });
        router.push('/'); // Redirect user to homepage after registration

      } else {
        // Registration failed - handle specific errors if available
        let errorMessage = data.message || "Could not create account. Please try again later.";
        // Check for validation errors specifically
         if (data.errors) {
             const errorMessages = Object.values(data.errors).map((err: any) => err.message).join(' ');
             errorMessage = `Validation failed: ${errorMessages}`;
         } else if (response.status === 409) { // Conflict (email exists)
             errorMessage = data.message || "This email address is already registered.";
         }

        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('Registration fetch error:', error);
      toast({
        variant: "destructive",
        title: "Registration Error",
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
          <CardTitle className="text-2xl font-bold">Register</CardTitle>
          <CardDescription>Create a new account to start shopping</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                autoComplete="name"
              />
            </div>
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
               <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                 placeholder="********"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
             <div className="space-y-2">
               <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                 placeholder="********"
                required
                 minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Creating Account...
                   </>
               ) : (
                 'Register'
               )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
           <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                    Login
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
