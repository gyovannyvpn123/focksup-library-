/**
 * WhatsApp Web connection manager
 */

import EventEmitter from 'events';
import WebSocket from 'ws';
import { ClientOptions, AuthenticationCredentials } from './Types';
import { parseMessageNode, generateMessageTag } from './WAProtocol';
import { encrypt, decrypt, generateKeypair } from './Crypto';
import { 
    DEFAULT_WA_WEB_URL, 
    DEFAULT_WA_WEB_VERSION,
    KEEP_ALIVE_INTERVAL_MS
} from './Constants';
import { createLogger } from './Utils';

export class WAConnection extends EventEmitter {
    private ws: WebSocket | null = null;
    private options: ClientOptions;
    private credentials?: AuthenticationCredentials;
    private authState: 'disconnected' | 'connecting' | 'authenticating' | 'connected' = 'disconnected';
    private authPromise?: Promise<void>;
    private authResolve?: () => void;
    private authReject?: (err: Error) => void;
    private keepAliveInterval?: NodeJS.Timeout;
    private msgRetryCache: Map<string, { resolve: Function, reject: Function }> = new Map();
    private logger: ReturnType<typeof createLogger>;
    
    constructor(options: ClientOptions) {
        super();
        this.options = options;
        this.logger = createLogger('WAConnection', options.logLevel);
    }
    
    /**
     * Connect to WhatsApp Web
     */
    async connect(): Promise<void> {
        if (this.ws) {
            throw new Error('Connection already exists');
        }
        
        try {
            this.authState = 'connecting';
            this.ws = new WebSocket(DEFAULT_WA_WEB_URL);
            
            this.setupWebSocketListeners();
            
            // Initialize the connection
            await this.waitForOpen();
            await this.initializeConnection();
            
            // Start keep-alive interval
            this.startKeepAlive();
            
            this.logger.info('Successfully connected to WhatsApp Web');
        } catch (error) {
            this.logger.error('Failed to connect:', error);
            await this.disconnect();
            throw error;
        }
    }
    
    /**
     * Connect with existing credentials
     * @param credentials Authentication credentials
     */
    async connectWithCredentials(credentials: AuthenticationCredentials): Promise<void> {
        try {
            await this.connect();
            this.credentials = credentials;
            
            // Authenticate with saved credentials
            await this.authenticate(credentials);
            
            this.authState = 'connected';
            this.emit('open');
        } catch (error) {
            this.logger.error('Failed to connect with credentials:', error);
            throw error;
        }
    }
    
    /**
     * Disconnect from WhatsApp Web
     */
    async disconnect(): Promise<void> {
        this.logger.info('Disconnecting from WhatsApp Web');
        
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = undefined;
        }
        
        if (this.ws) {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close();
            }
            
            this.ws.removeAllListeners();
            this.ws = null;
        }
        
        this.authState = 'disconnected';
        this.msgRetryCache.clear();
    }
    
    /**
     * Request a QR code for authentication
     */
    async requestQRCode(): Promise<string> {
        if (this.authState !== 'connecting') {
            throw new Error('Connection is not in the correct state for QR code request');
        }
        
        try {
            // Generate keypair for authentication
            const { public: publicKey, private: privateKey } = await generateKeypair();
            
            // Request QR code
            const response = await this.sendRequest({
                tag: 'request_qr',
                data: {
                    publicKey
                }
            });
            
            // Store credentials (partial, until authenticated)
            this.credentials = {
                publicKey,
                privateKey,
                serverPublicKey: response.serverPublicKey,
                qrCode: response.qrCode
            };
            
            this.authState = 'authenticating';
            this.setupAuthenticationPromise();
            
            return response.qrCode;
        } catch (error) {
            this.logger.error('Failed to request QR code:', error);
            throw error;
        }
    }
    
    /**
     * Request a pairing code for authentication
     */
    async requestPairingCode(): Promise<string> {
        if (this.authState !== 'connecting') {
            throw new Error('Connection is not in the correct state for pairing code request');
        }
        
        try {
            // Generate keypair for authentication
            const { public: publicKey, private: privateKey } = await generateKeypair();
            
            // Request pairing code
            const response = await this.sendRequest({
                tag: 'request_pairing_code',
                data: {
                    publicKey
                }
            });
            
            // Store credentials (partial, until authenticated)
            this.credentials = {
                publicKey,
                privateKey,
                serverPublicKey: response.serverPublicKey,
                pairingCode: response.pairingCode
            };
            
            this.authState = 'authenticating';
            this.setupAuthenticationPromise();
            
            return response.pairingCode;
        } catch (error) {
            this.logger.error('Failed to request pairing code:', error);
            throw error;
        }
    }
    
    /**
     * Wait for authentication to complete
     */
    async waitForAuthentication(): Promise<void> {
        if (this.authState !== 'authenticating') {
            throw new Error('Not in authentication state');
        }
        
        if (!this.authPromise) {
            this.setupAuthenticationPromise();
        }
        
        return this.authPromise;
    }
    
    /**
     * Get current authentication credentials
     */
    getCredentials(): AuthenticationCredentials | undefined {
        return this.credentials;
    }
    
    /**
     * Send a message to WhatsApp server
     * @param message Message to send
     */
    async send(message: any): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket connection is not open');
        }
        
        try {
            const serialized = JSON.stringify(message);
            const encrypted = this.credentials 
                ? encrypt(serialized, this.credentials.serverPublicKey) 
                : serialized;
                
            this.ws.send(encrypted);
        } catch (error) {
            this.logger.error('Failed to send message:', error);
            throw error;
        }
    }
    
    /**
     * Send a request and wait for response
     * @param request Request data
     * @param timeout Timeout in milliseconds
     */
    async sendRequest(request: any, timeout = 30000): Promise<any> {
        const tag = request.tag || generateMessageTag();
        
        // Add tag to request
        const taggedRequest = {
            ...request,
            tag
        };
        
        return new Promise((resolve, reject) => {
            // Setup timeout
            const timeoutId = setTimeout(() => {
                this.msgRetryCache.delete(tag);
                reject(new Error(`Request ${tag} timed out after ${timeout}ms`));
            }, timeout);
            
            // Store callbacks in cache
            this.msgRetryCache.set(tag, {
                resolve: (result: any) => {
                    clearTimeout(timeoutId);
                    this.msgRetryCache.delete(tag);
                    resolve(result);
                },
                reject: (error: Error) => {
                    clearTimeout(timeoutId);
                    this.msgRetryCache.delete(tag);
                    reject(error);
                }
            });
            
            // Send the request
            this.send(taggedRequest).catch(err => {
                clearTimeout(timeoutId);
                this.msgRetryCache.delete(tag);
                reject(err);
            });
        });
    }
    
    /**
     * Initialize the WebSocket connection
     */
    private async initializeConnection(): Promise<void> {
        // Send initialization message
        await this.send({
            type: 'init',
            version: DEFAULT_WA_WEB_VERSION,
            browser: this.options.browser || {
                name: 'Chrome',
                version: '96.0.4664.110'
            }
        });
    }
    
    /**
     * Authenticate with credentials
     * @param credentials Authentication credentials
     */
    private async authenticate(credentials: AuthenticationCredentials): Promise<void> {
        // Send authentication request
        await this.send({
            type: 'auth',
            credentials: {
                publicKey: credentials.publicKey,
                // Other credential information needed for authentication
            }
        });
    }
    
    /**
     * Setup the authentication promise
     */
    private setupAuthenticationPromise(): void {
        this.authPromise = new Promise((resolve, reject) => {
            this.authResolve = resolve;
            this.authReject = reject;
        });
    }
    
    /**
     * Wait for WebSocket to open
     */
    private waitForOpen(): Promise<void> {
        if (!this.ws) {
            return Promise.reject(new Error('WebSocket is not initialized'));
        }
        
        if (this.ws.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            if (!this.ws) {
                return reject(new Error('WebSocket is not initialized'));
            }
            
            const onOpen = () => {
                this.ws?.removeListener('error', onError);
                resolve();
            };
            
            const onError = (err: Error) => {
                this.ws?.removeListener('open', onOpen);
                reject(err);
            };
            
            this.ws.once('open', onOpen);
            this.ws.once('error', onError);
        });
    }
    
    /**
     * Start keep-alive interval
     */
    private startKeepAlive(): void {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
        }
        
        this.keepAliveInterval = setInterval(() => {
            try {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.send({ type: 'ping' }).catch(err => {
                        this.logger.warn('Failed to send ping:', err);
                    });
                }
            } catch (error) {
                this.logger.error('Keep-alive error:', error);
            }
        }, KEEP_ALIVE_INTERVAL_MS);
    }
    
    /**
     * Setup WebSocket event listeners
     */
    private setupWebSocketListeners(): void {
        if (!this.ws) return;
        
        this.ws.on('open', () => {
            this.logger.info('WebSocket connection opened');
        });
        
        this.ws.on('message', (data: string) => {
            try {
                // Decrypt if needed
                const decrypted = this.credentials 
                    ? decrypt(data, this.credentials.privateKey) 
                    : data;
                
                const message = JSON.parse(decrypted);
                this.handleIncomingMessage(message);
            } catch (error) {
                this.logger.error('Failed to process message:', error);
            }
        });
        
        this.ws.on('close', (code, reason) => {
            const reasonStr = reason ? reason.toString() : '';
            this.logger.info(`WebSocket connection closed: ${code} - ${reasonStr}`);
            this.handleConnectionClose(code, reasonStr);
        });
        
        this.ws.on('error', (error) => {
            this.logger.error('WebSocket error:', error);
            this.emit('connection_error', error);
        });
    }
    
    /**
     * Handle incoming WebSocket messages
     * @param message Parsed message
     */
    private handleIncomingMessage(message: any): void {
        // Check if this is a response to a pending request
        if (message.tag && this.msgRetryCache.has(message.tag)) {
            const { resolve, reject } = this.msgRetryCache.get(message.tag)!;
            
            if (message.error) {
                reject(new Error(message.error));
            } else {
                resolve(message);
            }
            
            return;
        }
        
        // Handle authentication success
        if (message.type === 'auth_success') {
            this.handleAuthSuccess(message);
            return;
        }
        
        // Handle normal messages
        if (message.type === 'message') {
            const parsedMessage = parseMessageNode(message.data);
            this.emit('message', parsedMessage);
            return;
        }
        
        // Handle other message types
        switch (message.type) {
            case 'presence_update':
                this.emit('presence_update', message.data);
                break;
            
            case 'group_update':
                this.emit('group_update', message.data);
                break;
                
            case 'message_revoke':
                this.emit('message_revoke', message.data);
                break;
                
            case 'message_create':
                this.emit('message_create', message.data);
                break;
                
            default:
                // Unknown message type
                this.logger.debug('Received unknown message type:', message.type);
                break;
        }
    }
    
    /**
     * Handle authentication success
     * @param message Success message
     */
    private handleAuthSuccess(message: any): void {
        if (!this.credentials) {
            this.logger.warn('Received auth success but no credentials are stored');
            return;
        }
        
        // Update credentials with any additional server data
        this.credentials = {
            ...this.credentials,
            ...message.credentials
        };
        
        this.authState = 'connected';
        
        // Resolve authentication promise if exists
        if (this.authResolve) {
            this.authResolve();
            this.authResolve = undefined;
            this.authReject = undefined;
        }
        
        this.emit('open');
    }
    
    /**
     * Handle WebSocket connection close
     * @param code Close code
     * @param reason Close reason
     */
    private handleConnectionClose(code: number, reason: string): void {
        // Reject pending authentication if needed
        if (this.authState === 'authenticating' && this.authReject) {
            this.authReject(new Error(`Connection closed during authentication: ${code} - ${reason}`));
            this.authResolve = undefined;
            this.authReject = undefined;
        }
        
        this.authState = 'disconnected';
        this.emit('close', { code, reason });
    }
}
