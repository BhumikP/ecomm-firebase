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

    console.log('Attempting registration with:', { name, email, password });

    // --- Mock Registration Logic ---
    // Replace this with your actual Firebase or backend registration call
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    // Example: Simulate success (replace with real logic)
    // In a real app, you'd check if the email is already taken, etc.
    const registrationSuccessful = true; // Assume success for now

    if (registrationSuccessful) {
      // Simulate successful registration & automatic login
      localStorage.setItem('userRole', 'user'); // Store role
      localStorage.setItem('isLoggedIn', 'true');
      toast({
        title: "Registration Successful",
        description: "Your account has been created. Welcome!",
      });
      router.push('/'); // Redirect user to homepage after registration
    } else {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Could not create account. Please try again later.", // Or provide specific error
      });
    }
    // --- End Mock Registration Logic ---

    setIsLoading(false);
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
              />
            </div>
            <div className="space-y-2">
               <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                 placeholder="********"
                required
                minLength={6} // Add minimum length requirement
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
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
