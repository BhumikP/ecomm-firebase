
// src/components/shared/login-prompt-dialog.tsx
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface LoginPromptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: () => void;
}

export function LoginPromptDialog({ isOpen, onOpenChange, onCancel }: LoginPromptDialogProps) {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/auth/login');
    onOpenChange(false);
  };

  const handleRegister = () => {
    router.push('/auth/register');
    onOpenChange(false);
  };

  const handleDialogCancel = () => {
    if (onCancel) {
        onCancel();
    }
    onOpenChange(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Login Required</AlertDialogTitle>
          <AlertDialogDescription>
            You need to be logged in to perform this action. Please log in or create an account to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDialogCancel}>Cancel</AlertDialogCancel>
          <Button variant="outline" onClick={handleRegister}>Register</Button>
          <AlertDialogAction onClick={handleLogin}>Login</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
