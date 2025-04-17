/**
 * Authentication utilities for WhatsApp Web
 */

import qrcode from 'qrcode';
import { QRCodeOptions } from './Types';
import { createLogger } from './Utils';

const logger = createLogger('Auth');

/**
 * Generate a QR code image from the QR code data
 * @param qrData QR code data
 * @param options QR code generation options
 */
export async function generateQRCode(qrData: string, options: Partial<QRCodeOptions> = {}): Promise<string> {
    try {
        // Default options
        const qrOptions = {
            margin: 1,
            scale: 8,
            errorCorrectionLevel: 'L' as const, // Specify as literal type for TypeScript
            color: {
                dark: '#000000',
                light: '#ffffff'
            },
            ...options
        };
        
        // Generate QR code as data URL
        const qrCodeImage = await qrcode.toDataURL(qrData, qrOptions);
        
        // Also generate text version for terminal
        const qrCodeText = await qrcode.toString(qrData, { type: 'terminal' });
        console.log(qrCodeText);
        
        return qrCodeImage;
    } catch (error) {
        logger.error('Failed to generate QR code:', error);
        throw error;
    }
}

/**
 * Generate a pairing code from pairing data
 * @param pairingData Pairing code data
 */
export async function generatePairingCode(pairingData: string): Promise<string> {
    try {
        // In a real implementation, we would format the pairing code according to WhatsApp's format
        // This is a simplified version for demonstration
        
        // Format the code to be 8 digits separated by dashes
        const code = pairingData
            .replace(/[^0-9]/g, '') // Keep only numbers
            .substring(0, 8) // Take first 8 digits
            .match(/.{1,4}/g)! // Group by 4
            .join('-'); // Join with dashes
            
        logger.info(`Generated pairing code: ${code}`);
        
        return code;
    } catch (error) {
        logger.error('Failed to generate pairing code:', error);
        throw error;
    }
}

/**
 * Validate authentication credentials
 * @param credentials Credentials to validate
 */
export function validateCredentials(credentials: any): boolean {
    if (!credentials) return false;
    
    // Check for required fields
    const requiredFields = ['publicKey', 'privateKey', 'serverPublicKey'];
    
    for (const field of requiredFields) {
        if (!credentials[field]) {
            logger.warn(`Missing required credential field: ${field}`);
            return false;
        }
    }
    
    return true;
}

/**
 * Format authentication credentials for storage
 * @param credentials Raw credentials
 */
export function formatCredentialsForStorage(credentials: any): string {
    try {
        return JSON.stringify(credentials);
    } catch (error) {
        logger.error('Failed to format credentials for storage:', error);
        throw error;
    }
}

/**
 * Parse authentication credentials from storage
 * @param storedCredentials Stored credentials string
 */
export function parseCredentialsFromStorage(storedCredentials: string): any {
    try {
        return JSON.parse(storedCredentials);
    } catch (error) {
        logger.error('Failed to parse credentials from storage:', error);
        throw error;
    }
}
