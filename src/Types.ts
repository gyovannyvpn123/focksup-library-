/**
 * Type definitions for the library
 */

// Client options
export interface ClientOptions {
    restartOnConnectionLost: boolean;
    maxReconnectAttempts: number;
    reconnectInterval: number;
    logLevel: string;
    browser?: {
        name: string;
        version: string;
    };
}

// Authentication credentials
export interface AuthenticationCredentials {
    publicKey: string;
    privateKey: string;
    serverPublicKey: string;
    qrCode?: string;
    pairingCode?: string;
    session?: string;
}

// Connection state
export type ConnectionState = 'disconnected' | 'connecting' | 'authenticating' | 'connected';

// Message types
export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    DOCUMENT = 'document',
    STICKER = 'sticker',
    CONTACT = 'contact',
    LOCATION = 'location'
}

// Base message interface
export interface Message {
    id: string;
    from: string;
    to: string;
    fromMe: boolean;
    timestamp: number;
    type: MessageType;
    body?: string;
    caption?: string;
    filename?: string;
    mimetype?: string;
    url?: string;
    latitude?: number;
    longitude?: number;
    mentionedJids?: string[];
    isForwarded?: boolean;
    quotedMessageId?: string;
    groupId?: string;
}

// Text message
export interface TextMessage extends Message {
    type: MessageType.TEXT;
    body: string;
}

// Media message base
export interface MediaMessage extends Message {
    caption?: string;
    mimetype: string;
    url: string;
}

// Image message
export interface ImageMessage extends MediaMessage {
    type: MessageType.IMAGE;
    width?: number;
    height?: number;
}

// Video message
export interface VideoMessage extends MediaMessage {
    type: MessageType.VIDEO;
    duration?: number;
    width?: number;
    height?: number;
}

// Audio message
export interface AudioMessage extends MediaMessage {
    type: MessageType.AUDIO;
    duration?: number;
}

// Document message
export interface DocumentMessage extends MediaMessage {
    type: MessageType.DOCUMENT;
    filename: string;
}

// Contact message
export interface ContactMessage extends Message {
    type: MessageType.CONTACT;
    vcard: string;
}

// Location message
export interface LocationMessage extends Message {
    type: MessageType.LOCATION;
    latitude: number;
    longitude: number;
    address?: string;
}

// Group information
export interface GroupInfo {
    id: string;
    subject: string;
    description?: string;
    owner: string;
    creation: number;
    participants: GroupParticipant[];
}

// Group participant
export interface GroupParticipant {
    id: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
}

// Group update
export interface GroupUpdate {
    id: string;
    type: 'add' | 'remove' | 'promote' | 'demote' | 'subject' | 'description' | 'leave' | 'join';
    participants?: string[];
    actor?: string;
    subject?: string;
    description?: string;
}

// Presence update
export interface PresenceUpdate {
    id: string;
    presence: 'available' | 'unavailable' | 'composing' | 'recording' | 'paused';
    timestamp: number;
}

// Message send options
export interface MessageSendOptions {
    quoted?: Message;
    mentions?: string[];
    scheduled?: number;
    sendSeen?: boolean;
}

// Media upload options
export interface MediaUploadOptions {
    filename?: string;
    caption?: string;
    mimetype?: string;
}

// QR code options
export interface QRCodeOptions {
    size?: number;
    margin?: number;
    color?: {
        dark: string;
        light: string;
    };
}
