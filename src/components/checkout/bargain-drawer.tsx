// src/components/checkout/bargain-drawer.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Loader2, Sparkles, Send } from 'lucide-react';
import { bargainForCart } from '@/ai/flows/bargain-flow';
import type { BargainOutput } from '@/ai/flows/bargain-flow';
import type { PopulatedCart } from '@/app/checkout/page';

interface BargainDrawerProps {
  cart: PopulatedCart | null;
  userId?: string | null;
  chatHistory: { author: 'user' | 'ai'; text: string }[];
  onBargainComplete: (prompt: string, result: BargainOutput) => void;
}

export function BargainDrawer({
  cart,
  userId,
  chatHistory,
  onBargainComplete,
}: BargainDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
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
      onBargainComplete(prompt, result);
    } catch (error) {
      console.error("Bargaining failed:", error);
      onBargainComplete(prompt, {
        responseMessage: "Sorry, I encountered an error and can't bargain right now. Please try again later.",
        discounts: [],
      });
    } finally {
      setPrompt(''); // Clear prompt after sending
      setIsBargaining(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
          <p 
              className="text-center text-sm text-primary hover:underline mt-4 cursor-pointer flex items-center justify-center gap-1"
          >
              <Sparkles className="h-4 w-4" />
              Want a better deal? Try bargaining!
          </p>
      </DrawerTrigger>
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
             {chatHistory.length > 0 && (
                <div className="bg-muted p-3 rounded-lg text-sm max-h-48 overflow-y-auto space-y-3">
                    {chatHistory.map((msg, index) => (
                        <div key={index}>
                            <p className="font-semibold text-foreground">{msg.author === 'user' ? 'You' : 'Shopkeeper'}:</p>
                            <p className="text-muted-foreground whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    ))}
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
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
