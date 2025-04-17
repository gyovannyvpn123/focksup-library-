/**
 * Cryptographic functions for WhatsApp protocol
 */

import crypto from 'crypto';

/**
 * Generate a keypair for authentication
 */
export async function generateKeypair(): Promise<{ public: string, private: string }> {
    return new Promise((resolve, reject) => {
        try {
            // Generate RSA keypair
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });
            
            resolve({
                public: publicKey,
                private: privateKey
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Encrypt data using public key
 * @param data Data to encrypt
 * @param publicKey Public key for encryption
 */
export function encrypt(data: string, publicKey: string): string {
    // In a real implementation, we would use the proper WhatsApp encryption scheme
    // This is a simplified version for demonstration
    
    const encryptedData = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
        },
        Buffer.from(data)
    );
    
    return encryptedData.toString('base64');
}

/**
 * Decrypt data using private key
 * @param data Encrypted data
 * @param privateKey Private key for decryption
 */
export function decrypt(data: string, privateKey: string): string {
    // In a real implementation, we would use the proper WhatsApp decryption scheme
    // This is a simplified version for demonstration
    
    const decryptedData = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
        },
        Buffer.from(data, 'base64')
    );
    
    return decryptedData.toString();
}

/**
 * Generate HMAC signature
 * @param data Data to sign
 * @param key Key for signing
 */
export function hmacSign(data: string, key: string): string {
    return crypto
        .createHmac('sha256', key)
        .update(data)
        .digest('base64');
}

/**
 * Generate a random key
 * @param length Key length in bytes
 */
export function generateRandomKey(length: number = 32): Buffer {
    return crypto.randomBytes(length);
}

/**
 * Derive keys from a master key
 * @param masterKey Master key
 * @param info Additional info for key derivation
 */
export function deriveKeys(masterKey: Buffer, info: string): { encKey: Buffer, macKey: Buffer } {
    // HKDF key derivation
    const encKey = crypto.createHmac('sha256', masterKey)
        .update(Buffer.from(`${info}encKey`))
        .digest();
        
    const macKey = crypto.createHmac('sha256', masterKey)
        .update(Buffer.from(`${info}macKey`))
        .digest();
        
    return { encKey, macKey };
}
