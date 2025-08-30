// src/lib/razorpay.ts
import crypto from 'crypto';
import Razorpay from 'razorpay';

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Create Razorpay instance only if credentials are available
export const razorpayInstance = (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) 
  ? new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    })
  : null;

/**
 * Verifies the signature of a Razorpay webhook.
 * The body is the raw JSON string from the webhook.
 * @param body The raw request body from the webhook.
 * @param signature The 'x-razorpay-signature' header from the request.
 * @param secret The webhook secret configured in your Razorpay dashboard.
 * @returns boolean indicating if the signature is valid.
 */
export const verifyRazorpayWebhookSignature = (
    body: string,
    signature: string,
    secret: string
): boolean => {
    try {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(body);
        const generated_signature = hmac.digest('hex');
        return generated_signature === signature;
    } catch (error) {
        console.error("Error verifying Razorpay webhook signature:", error);
        return false;
    }
};


/**
 * Verifies the payment signature from the client-side callback.
 * The body is a concatenation of the order_id and payment_id.
 * @param order_id The Razorpay Order ID.
 * @param payment_id The Razorpay Payment ID.
 * @param signature The signature received in the client-side handler.
 * @returns boolean indicating if the signature is valid.
 */
export const verifyPaymentSignature = (
    order_id: string,
    payment_id: string,
    signature: string
): boolean => {
    if (!RAZORPAY_KEY_SECRET) {
        console.error("Cannot verify payment signature: RAZORPAY_KEY_SECRET is not configured.");
        return false;
    }
    try {
        const body = `${order_id}|${payment_id}`;
        const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
        hmac.update(body);
        const generated_signature = hmac.digest('hex');
        return generated_signature === signature;
    } catch (error) {
        console.error("Error verifying Razorpay payment signature:", error);
        return false;
    }
};

/**
 * Creates a Razorpay order with proper error handling
 * @param amount Amount in rupees
 * @param currency Currency code (default: INR)
 * @param receipt Receipt identifier
 * @returns Promise with order details or throws error
 */
export const createRazorpayOrder = async (
    amount: number,
    currency: string = 'INR',
    receipt?: string
) => {
    if (!razorpayInstance) {
        throw new Error("Razorpay instance not available. Check your environment variables.");
    }
    
    if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
    }
    
    try {
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
        };
        
        const order = await razorpayInstance.orders.create(options);
        
        return order;
    } catch (error: any) {
        
        // Return more specific error messages
        if (error.statusCode === 400) {
            throw new Error(`Invalid request parameters: ${error.error?.description || error.message}`);
        } else if (error.statusCode === 401) {
            throw new Error("Invalid Razorpay credentials. Check your Key ID and Secret.");
        } else if (error.statusCode === 500) {
            throw new Error("Razorpay server error. Please try again later.");
        } else {
            throw new Error(`Razorpay error: ${error.message}`);
        }
    }
};
