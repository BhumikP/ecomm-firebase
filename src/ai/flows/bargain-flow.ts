// src/ai/flows/bargain-flow.ts
'use server';
/**
 * @fileOverview An AI agent for negotiating discounts on a shopping cart.
 *
 * - bargainForCart - A function that handles the bargaining process.
 * - BargainInput - The input type for the bargainForCart function.
 * - BargainOutput - The return type for the bargainForCart function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { getUserTransactionSummary } from '@/services/transaction-service';
import type { PopulatedCart } from '@/app/checkout/page';

// Define Zod schemas for input and output to ensure type safety and structured data.
const ProductInfoSchema = z.object({
  productId: z.string().describe('The unique ID of the product.'),
  productName: z.string().describe('The name of the product.'),
  quantity: z.number().describe('The quantity of this product in the cart.'),
  price: z.number().describe('The current price per unit of the product.'),
});

const BargainInputSchema = z.object({
  cart: z.any().describe('The customer\'s current shopping cart object.'),
  userId: z.string().describe('The unique ID of the customer.'),
  customerPrompt: z.string().describe('The customer\'s message or offer for a discount.'),
});
export type BargainInput = z.infer<typeof BargainInputSchema>;

const DiscountSchema = z.object({
  productId: z.string().describe("The ID of the product being discounted."),
  productName: z.string().describe("The name of the product being discounted."),
  discountAmount: z.number().describe("The per-item discount amount in INR."),
});

const BargainOutputSchema = z.object({
  responseMessage: z.string().describe("The shopkeeper's response to the customer's prompt. This should be friendly, conversational, and explain the offer."),
  discounts: z.array(DiscountSchema).describe("An array of product discounts. If no discount is given, this array will be empty."),
});
export type BargainOutput = z.infer<typeof BargainOutputSchema>;

/**
 * An exported wrapper function that calls the Genkit flow.
 * This is the primary function to be used by the application UI.
 * @param input - The bargaining request from the user.
 * @returns A promise that resolves to the AI's response and any applicable discounts.
 */
export async function bargainForCart(input: BargainInput): Promise<BargainOutput> {
  return bargainFlow(input);
}

// Define the main Genkit prompt for the bargaining agent.
const bargainPrompt = ai.definePrompt({
  name: 'bargainPrompt',
  input: {
    schema: z.object({
      cartItems: z.array(ProductInfoSchema),
      customerPrompt: z.string(),
      transactionHistory: z.any(),
    }),
  },
  output: { schema: BargainOutputSchema },
  prompt: `You are a friendly but savvy e-commerce shopkeeper. Your goal is to negotiate with customers to make a sale, offering small, personalized discounts to encourage loyalty, especially for returning customers.

RULES:
- All prices and discounts are in Indian Rupees (INR).
- Your responses must be conversational and friendly.
- Discounts are given PER-ITEM, not on the total. Your output must list each discounted product separately.
- The maximum discount you can EVER give on a single item is 15% of its price.
- Be more generous with customers who have a good purchase history (high total spent, many successful transactions).
- Be less generous or don't offer a discount to brand new customers or those with many failed/cancelled transactions. Use the transaction history to decide.
- If you give a discount, explain it in your response message (e.g., "Since you're a loyal customer, I can give you a special price on...").
- If you don't give a discount, politely decline (e.g., "These prices are already the best I can do, but I appreciate you asking!").

CUSTOMER'S TRANSACTION HISTORY:
{{{json transactionHistory}}}

ITEMS IN CURRENT CART:
{{#each cartItems}}
- Product: {{this.productName}} (ID: {{this.productId}})
- Quantity: {{this.quantity}}
- Price: ₹{{this.price}} per item
{{/each}}

CUSTOMER'S MESSAGE:
"{{{customerPrompt}}}"

Analyze the customer's history and their cart, then respond to their message and decide on the appropriate discounts.
`,
});

// Define the Genkit flow that orchestrates the bargaining process.
const bargainFlow = ai.defineFlow(
  {
    name: 'bargainFlow',
    inputSchema: BargainInputSchema,
    outputSchema: BargainOutputSchema,
  },
  async (input) => {
    // 1. Fetch the user's transaction summary.
    const transactionHistory = await getUserTransactionSummary(input.userId);

    // 2. Format the cart items for the prompt.
    const cartItems = (input.cart as PopulatedCart).items.map(item => ({
      productId: item.product._id.toString(),
      productName: item.nameSnapshot,
      quantity: item.quantity,
      price: item.priceSnapshot,
    }));

    // 3. Call the AI prompt with the prepared context.
    const { output } = await bargainPrompt({
      cartItems,
      customerPrompt: input.customerPrompt,
      transactionHistory,
    });

    // 4. Return the structured output from the AI.
    return output!;
  }
);
