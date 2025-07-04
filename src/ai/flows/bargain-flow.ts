// src/ai/flows/bargain-flow.ts
'use server';
/**
 * @fileOverview An AI agent for negotiating cart discounts.
 *
 * - bargainForCart - A function that handles the bargaining process.
 * - BargainInput - The input type for the bargainForCart function.
 * - BargainOutput - The return type for the bargainForCart function.
 */
import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { getUserTransactionSummary } from '@/services/transaction-service';

// Input Schema: What the flow needs to start
const BargainCartItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  price: z.number(),
  quantity: z.number(),
});

const BargainInputSchema = z.object({
  userId: z.string(),
  prompt: z.string().describe('The user\'s natural language bargaining request.'),
  cartItems: z.array(BargainCartItemSchema),
});
export type BargainInput = z.infer<typeof BargainInputSchema>;


// Output Schema: What the flow will return
const BargainResultItemSchema = z.object({
  productId: z.string().describe('The ID of the product being discounted.'),
  discountAmount: z.number().describe('The per-item discount amount. This should be a positive number representing the value to subtract from the original price.'),
});

const BargainOutputSchema = z.object({
  responseMessage: z.string().describe('A friendly, in-character response to the user explaining the offer.'),
  discounts: z.array(BargainResultItemSchema),
});
export type BargainOutput = z.infer<typeof BargainOutputSchema>;


// The main exported function that the API route will call
export async function bargainForCart(input: BargainInput): Promise<BargainOutput> {
  return bargainFlow(input);
}

// Genkit Prompt Definition
const bargainPrompt = ai.definePrompt(
  {
    name: 'bargainPrompt',
    input: {
      schema: z.object({
        prompt: z.string(),
        cartJson: z.string(),
        historyJson: z.string(),
      }),
    },
    output: {
      schema: BargainOutputSchema,
    },
    prompt: `You are BargainBot, a friendly and fair shopkeeper. A customer wants to negotiate the price of their shopping cart.

Your task is to analyze their request, their shopping history, and their current cart to provide a reasonable, personalized discount.

BARGAINING RULES:
1.  **Be Friendly:** Always start with a warm, conversational reply.
2.  **Justify Your Offer:** Briefly explain *why* you are giving the discount you've decided on, referencing their loyalty or the specific items.
3.  **Per-Item Discounts:** Your final decision must be a discount amount for *each item* in the cart. It can be zero for some items.
4.  **No First-Time Max Discounts:** Do not give a large discount to a new customer (e.g., someone with 0 or 1 successful transaction). Reward loyalty. A small, token discount is okay for new customers to encourage them.
5.  **Max Discount Cap:** The TOTAL discount across all items must NOT exceed 15% of the cart's subtotal. Calculate this carefully.
6.  **Output Format:** You MUST provide your response and then the final JSON object as specified.

CUSTOMER'S BARGAINING REQUEST:
"{{prompt}}"

CUSTOMER'S SHOPPING HISTORY:
{{{historyJson}}}

CUSTOMER'S CURRENT CART:
{{{cartJson}}}

Now, generate your friendly response and the corresponding JSON discount object.`,
  }
);


// Genkit Flow Definition
const bargainFlow = ai.defineFlow(
  {
    name: 'bargainFlow',
    inputSchema: BargainInputSchema,
    outputSchema: BargainOutputSchema,
  },
  async (input) => {
    // 1. Get user transaction history summary
    const history = await getUserTransactionSummary(input.userId);

    // 2. Call the prompt with all the required data
    const { output } = await bargainPrompt({
        prompt: input.prompt,
        cartJson: JSON.stringify(input.cartItems, null, 2),
        historyJson: JSON.stringify(history, null, 2),
    });

    // 3. Validate and return the structured output
    if (!output) {
      // Fallback response if the AI fails to generate valid output
      return {
        responseMessage: "I'm sorry, I'm having a little trouble with my calculations right now. Let's stick with the current prices for now, but feel free to try again later!",
        discounts: [],
      };
    }
    
    // Additional validation: Ensure total discount doesn't exceed the cap
    const subtotal = input.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const maxDiscount = subtotal * 0.15;
    const proposedDiscount = output.discounts.reduce((sum, d) => {
        const item = input.cartItems.find(i => i.productId === d.productId);
        return sum + (d.discountAmount * (item?.quantity || 0));
    }, 0);

    if (proposedDiscount > maxDiscount) {
        console.warn(`AI proposed a discount (${proposedDiscount}) exceeding the 15% cap (${maxDiscount}). Overriding.`);
        return {
           responseMessage: "I got a bit carried away with the discounts! Let's try a more reasonable offer. How does this look?",
           // For simplicity, we'll just return no discount in this edge case.
           // A more advanced implementation could scale down the proposed discounts.
           discounts: [],
        };
    }

    return output;
  }
);
