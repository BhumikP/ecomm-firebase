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
