/**
 * Constants used throughout the library
 */

// WhatsApp Web connection
export const DEFAULT_WA_WEB_URL = 'wss://web.whatsapp.com/ws';
export const DEFAULT_WA_WEB_VERSION = '2.2345.0'; // Update this to match current WhatsApp Web version

// Connection parameters
export const KEEP_ALIVE_INTERVAL_MS = 20000; // 20 seconds
export const RECONNECT_INTERVAL = 3000; // 3 seconds
export const MAX_RECONNECT_ATTEMPTS = 5;

// Authentication
export const AUTH_TIMEOUT = 60000; // 60 seconds

// Message types
export const MESSAGE_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    DOCUMENT: 'document',
    STICKER: 'sticker',
    CONTACT: 'contact',
    LOCATION: 'location'
};

// Media types
export const MEDIA_TYPES = {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    DOCUMENT: 'document'
};

// JID types
export const JID_TYPES = {
    USER: '@c.us',
    GROUP: '@g.us',
    BROADCAST: '@broadcast'
};

// WhatsApp status types
export const PRESENCE_TYPES = {
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable',
    COMPOSING: 'composing',
    RECORDING: 'recording',
    PAUSED: 'paused'
};

// Group actions
export const GROUP_ACTIONS = {
    CREATE: 'create',
    ADD: 'add',
    REMOVE: 'remove',
    LEAVE: 'leave',
    SUBJECT: 'subject',
    DESCRIPTION: 'description',
    PICTURE: 'picture',
    SETTINGS: 'settings'
};

// Error codes
export const ERROR_CODES = {
    AUTHENTICATION_FAILURE: 'auth_failure',
    CONNECTION_CLOSED: 'connection_closed',
    CONNECTION_LOST: 'connection_lost',
    CONNECTION_REFUSED: 'connection_refused',
    INVALID_JID: 'invalid_jid',
    MESSAGE_SEND_FAILED: 'message_send_failed',
    MEDIA_UPLOAD_FAILED: 'media_upload_failed',
    GROUP_ACTION_FAILED: 'group_action_failed'
};

// Default client options
export const DEFAULT_CLIENT_OPTIONS = {
    restartOnConnectionLost: true,
    maxReconnectAttempts: 5,
    reconnectInterval: 3000,
    logLevel: 'info',
    browser: {
        name: 'Chrome',
        version: '96.0.4664.110'
    }
};
