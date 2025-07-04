// src/components/checkout/bargain-drawer.tsx
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import type { PopulatedCart } from '@/app/checkout/page';
import type { BargainOutput } from '@/ai/flows/bargain-flow';

interface BargainDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cart: PopulatedCart | null;
  userId?: string;
  prompt: string;
  setPrompt: (prompt: string) => void;
  aiResponse: string;
  onBargainComplete: (result: BargainOutput) => void;
}

export function BargainDrawer({
  isOpen,
  onOpenChange,
  cart,
  userId,
  prompt,
  setPrompt,
  aiResponse,
  onBargainComplete
}: BargainDrawerProps) {
  const [isBargaining, setIsBargaining] = useState(false);
  const { toast } = useToast();

  const handleBargain = async () => {
    if (!prompt.trim()) {
      toast({ variant: 'destructive', title: 'Please make an offer.' });
      return;
    }
    if (!cart || !userId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cart or user information is missing.' });
      return;
    }

    setIsBargaining(true);

    const cartItemsForApi = cart.items.map(item => ({
        productId: item.product._id.toString(),
        productName: item.nameSnapshot,
        price: item.priceSnapshot,
        quantity: item.quantity,
    }));

    try {
      const response = await fetch('/api/bargain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, prompt, cartItems: cartItemsForApi }),
      });

      const result: BargainOutput = await response.json();

      if (!response.ok) {
        throw new Error((result as any).message || 'Failed to get a response from the bargain bot.');
      }
      onBargainComplete(result);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Bargaining Error', description: error.message });
      onBargainComplete({
        responseMessage: `Sorry, an error occurred: ${error.message}`,
        discounts: [],
      });
    } finally {
      setIsBargaining(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-full max-w-md ml-auto p-4 flex flex-col">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Let's Make a Deal!</DrawerTitle>
          <DrawerDescription>
            Tell me what you're thinking. Be creative! Your shopping history might just get you a better price.
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="p-4 space-y-4 flex-grow overflow-y-auto">
             {aiResponse && (
                <div className="bg-muted p-3 rounded-lg text-sm">
                   <p className="font-semibold mb-1">BargainBot says:</p>
                   <p className="whitespace-pre-wrap">{aiResponse}</p>
                </div>
            )}
            
            <Textarea
                placeholder="e.g., 'I'm a loyal customer, can you give me 10% off?' or 'I'll buy two if you give me a deal on the headphones.'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                disabled={isBargaining}
             />
        </div>
        
        <DrawerFooter className="mt-auto">
          <Button onClick={handleBargain} disabled={isBargaining || !prompt.trim()}>
            {isBargaining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {isBargaining ? 'Thinking...' : 'Make Offer'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
