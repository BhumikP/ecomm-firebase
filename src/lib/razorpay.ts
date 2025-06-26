// src/lib/razorpay.ts
import Razorpay from 'razorpay';
import crypto from 'crypto';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error('Razorpay Key ID or Key Secret is not configured in environment variables.');
}

export const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

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
