/**
 * Focksup Library - A Node.js library for WhatsApp Web interaction
 * 
 * This library provides functionality to interact with WhatsApp Web,
 * similar to the Baileys library, supporting both QR code and pairing code
 * authentication methods.
 */

// Export all public interfaces and classes
export { FocksupClient } from './Client';
export { WAConnection } from './WAConnection';
export { MessageHandler } from './MessageHandler';
export { GroupHandler } from './GroupHandler';
export { MediaHandler } from './MediaHandler';
export * from './Auth';
export * from './Types';
export * from './Constants';
export * from './Utils';

// Version information
export const version = '1.0.0';
