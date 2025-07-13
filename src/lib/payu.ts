
// src/lib/payu.ts
import crypto from 'crypto';

const PAYU_KEY = process.env.PAYU_KEY;
const PAYU_SALT = process.env.PAYU_SALT;

if (!PAYU_KEY || !PAYU_SALT) {
  console.warn('PayU Key or Salt is not configured in environment variables. PayU payments will fail.');
}

interface PayUTransactionDetails {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
}

/**
 * Generates the SHA512 hash required for PayU transactions.
 * @param details - The transaction details object.
 * @returns The generated SHA512 hash.
 */
export const generatePayuHash = (details: PayUTransactionDetails): string => {
  if (!PAYU_KEY || !PAYU_SALT) {
    throw new Error('PayU credentials are not configured on the server.');
  }

  const hashString = `${details.key}|${details.txnid}|${details.amount}|${details.productinfo}|${details.firstname}|${details.email}|||||||||||${PAYU_SALT}`;
  const sha = crypto.createHash('sha512');
  sha.update(hashString);
  return sha.digest('hex');
};

/**
 * Verifies the response hash from PayU to confirm transaction integrity.
 * @param details - The transaction details received from PayU.
 * @param receivedHash - The hash received in the PayU response.
 * @returns boolean indicating if the hash is valid.
 */
export const verifyPayuResponseHash = (details: PayUTransactionDetails & { status: string }, receivedHash: string): boolean => {
    if (!PAYU_KEY || !PAYU_SALT) {
        throw new Error('PayU credentials are not configured on the server.');
    }
    
    const hashString = `${PAYU_SALT}|${details.status}|||||||||||${details.email}|${details.firstname}|${details.productinfo}|${details.amount}|${details.txnid}|${PAYU_KEY}`;
    const sha = crypto.createHash('sha512');
    sha.update(hashString);
    const generatedHash = sha.digest('hex');
    
    return generatedHash === receivedHash;
};
