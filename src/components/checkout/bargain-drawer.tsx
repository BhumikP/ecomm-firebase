
// src/components/checkout/bargain-drawer.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Loader2, Sparkles, Send } from 'lucide-react';
import { bargainForCart } from '@/ai/flows/bargain-flow';
import type { BargainOutput } from '@/ai/flows/bargain-flow';
import type { PopulatedCart } from '@/app/checkout/page';

interface BargainDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cart: PopulatedCart | null;
  userId?: string | null;
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
  onBargainComplete,
}: BargainDrawerProps) {
  const [isBargaining, setIsBargaining] = useState(false);

  const handleBargain = async () => {
    if (!cart || !userId || !prompt) return;

    setIsBargaining(true);
    try {
      const result = await bargainForCart({
        cart,
        userId,
        customerPrompt: prompt,
      });
      onBargainComplete(result);
    } catch (error) {
      console.error("Bargaining failed:", error);
      onBargainComplete({
        responseMessage: "Sorry, I encountered an error and can't bargain right now. Please try again later.",
        discounts: [],
      });
    } finally {
      setIsBargaining(false);
      setPrompt(''); // Clear prompt after sending
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Let's Make a Deal!
            </DrawerTitle>
            <DrawerDescription>
              Tell the shopkeeper what you're looking for. Based on your cart and history, you might get a special price.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            {aiResponse && (
                <div className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-semibold text-foreground">Shopkeeper:</p>
                    <p className="text-muted-foreground">{aiResponse}</p>
                </div>
            )}
            <Textarea
              placeholder="e.g., 'I'm a regular customer, can I get a discount on the headphones?'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={isBargaining}
            />
          </div>
          <DrawerFooter>
            <Button onClick={handleBargain} disabled={isBargaining || !prompt}>
              {isBargaining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isBargaining ? 'Thinking...' : 'Send Offer'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
