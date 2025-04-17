/**
 * Utility functions for the library
 */

import crypto from 'crypto';

/**
 * Create a logger with the specified level
 * @param namespace Logger namespace
 * @param level Log level
 */
export function createLogger(namespace: string, level: string = 'info') {
    const logLevels = ['debug', 'info', 'warn', 'error'];
    const levelIndex = logLevels.indexOf(level);
    
    return {
        debug: (...args: any[]) => {
            if (levelIndex <= logLevels.indexOf('debug')) {
                console.debug(`[${namespace}]`, ...args);
            }
        },
        info: (...args: any[]) => {
            if (levelIndex <= logLevels.indexOf('info')) {
                console.info(`[${namespace}]`, ...args);
            }
        },
        warn: (...args: any[]) => {
            if (levelIndex <= logLevels.indexOf('warn')) {
                console.warn(`[${namespace}]`, ...args);
            }
        },
        error: (...args: any[]) => {
            if (levelIndex <= logLevels.indexOf('error')) {
                console.error(`[${namespace}]`, ...args);
            }
        }
    };
}

/**
 * Generate a random ID
 * @param length ID length
 */
export function generateRandomId(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate a phone number
 * @param phoneNumber Phone number to validate
 */
export function validatePhoneNumber(phoneNumber: string): string {
    // Remove any non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Ensure the number has a country code
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }
    
    // If no country code is there, assume Indonesia (62)
    if (cleaned.length <= 10) {
        cleaned = '62' + cleaned;
    }
    
    // Append @c.us suffix for WhatsApp formatting
    return cleaned + '@c.us';
}

/**
 * Extract phone number from JID
 * @param jid WhatsApp JID
 */
export function extractPhoneNumber(jid: string): string {
    return jid.split('@')[0];
}

/**
 * Check if a JID is a group
 * @param jid WhatsApp JID
 */
export function isGroupJid(jid: string): boolean {
    return jid.endsWith('@g.us');
}

/**
 * Convert a group JID to an invite link
 * @param groupId Group JID
 */
export function groupJidToInviteLink(groupId: string): string {
    if (!isGroupJid(groupId)) {
        throw new Error('Not a valid group JID');
    }
    
    const code = Buffer.from(groupId.replace('@g.us', '')).toString('base64');
    return `https://chat.whatsapp.com/${code}`;
}

/**
 * Delay execution for specified milliseconds
 * @param ms Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convert buffer to base64 string
 * @param buffer Buffer to convert
 */
export function bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
}

/**
 * Convert base64 string to buffer
 * @param base64 Base64 string
 */
export function base64ToBuffer(base64: string): Buffer {
    return Buffer.from(base64, 'base64');
}

/**
 * Format timestamp to ISO string
 * @param timestamp Timestamp (optional, defaults to now)
 */
export function formatTimestamp(timestamp?: number): string {
    const date = timestamp ? new Date(timestamp) : new Date();
    return date.toISOString();
}

/**
 * Get whatsapp file type from mime type
 * @param mimeType MIME type
 */
export function getWhatsAppFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'document';
    return 'document';
}
