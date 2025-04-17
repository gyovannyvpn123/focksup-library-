/**
 * Main client class for Focksup Library
 */

import EventEmitter from 'events';
import { WAConnection } from './WAConnection';
import { MessageHandler } from './MessageHandler';
import { GroupHandler } from './GroupHandler';
import { MediaHandler } from './MediaHandler';
import { generateQRCode, generatePairingCode } from './Auth';
import PuppeteerAuth from './PuppeteerAuth';
import FallbackAuth from './FallbackAuth';
import { 
    ClientOptions, 
    ConnectionState, 
    AuthenticationCredentials,
    MessageType,
    Message 
} from './Types';
import { delay, createLogger } from './Utils';

export class FocksupClient extends EventEmitter {
    private connection: WAConnection;
    private messageHandler: MessageHandler;
    private groupHandler: GroupHandler;
    private mediaHandler: MediaHandler;
    private options: ClientOptions;
    private credentials?: AuthenticationCredentials;
    private state: ConnectionState = 'disconnected';
    private logger: ReturnType<typeof createLogger>;
    
    constructor(options: Partial<ClientOptions> = {}) {
        super();
        
        this.options = {
            restartOnConnectionLost: true,
            maxReconnectAttempts: 5,
            reconnectInterval: 3000,
            logLevel: 'info',
            ...options
        };
        
        this.logger = createLogger('FocksupClient', this.options.logLevel);
        this.connection = new WAConnection(this.options);
        this.messageHandler = new MessageHandler(this.connection);
        this.groupHandler = new GroupHandler(this.connection);
        this.mediaHandler = new MediaHandler(this.connection);
        
        this.setupEventListeners();
    }
    
    /**
     * Connect to WhatsApp Web
     * @param credentials Optional credentials for reconnection
     */
    async connect(credentials?: AuthenticationCredentials): Promise<void> {
        try {
            this.logger.info('Connecting to WhatsApp Web...');
            this.state = 'connecting';
            this.emit('connecting');
            
            if (credentials) {
                this.credentials = credentials;
                await this.connection.connectWithCredentials(credentials);
            } else {
                await this.connection.connect();
                
                // Wait for authentication method selection (QR or pairing)
                this.state = 'authenticating';
                this.emit('auth_method_required');
            }
        } catch (error) {
            this.logger.error('Connection failed:', error);
            this.state = 'disconnected';
            this.emit('connection_failed', error);
            throw error;
        }
    }
    
    /**
     * Authenticate using QR Code
     */
    async authenticateWithQR(): Promise<void> {
        try {
            const qrData = await this.connection.requestQRCode();
            const qrCode = await generateQRCode(qrData);
            
            this.logger.info('Generated QR code for authentication');
            this.emit('qr', qrCode, qrData);
            
            // Wait for user to scan QR code
            await this.connection.waitForAuthentication();
            
            // Store credentials for reconnection
            this.credentials = this.connection.getCredentials();
            this.state = 'connected';
            this.emit('authenticated');
            this.emit('ready');
        } catch (error) {
            this.logger.error('QR authentication failed:', error);
            this.emit('auth_failure', error);
            throw error;
        }
    }
    
    /**
     * Authenticate using Pairing Code
     */
    async authenticateWithPairingCode(): Promise<string> {
        try {
            const pairingCodeData = await this.connection.requestPairingCode();
            const pairingCode = await generatePairingCode(pairingCodeData);
            
            this.logger.info('Generated pairing code for authentication');
            this.emit('pairing_code', pairingCode);
            
            // Wait for user to enter pairing code
            await this.connection.waitForAuthentication();
            
            // Store credentials for reconnection
            this.credentials = this.connection.getCredentials();
            this.state = 'connected';
            this.emit('authenticated');
            this.emit('ready');
            
            return pairingCode;
        } catch (error) {
            this.logger.error('Pairing code authentication failed:', error);
            this.emit('auth_failure', error);
            throw error;
        }
    }
    
    /**
     * Authenticate using Puppeteer (emulare browser)
     * Această metodă folosește Puppeteer pentru a emula un browser real
     * și a evita restricțiile WhatsApp Web asupra conexiunilor non-browser
     * 
     * Dacă Puppeteer nu este disponibil (din cauza lipsei dependențelor),
     * va încerca să folosească metoda de rezervă
     */
    async authenticateWithPuppeteer(): Promise<void> {
        try {
            this.logger.info('Inițiez autentificarea cu Puppeteer...');
            this.state = 'authenticating';
            
            const puppeteerAuth = new PuppeteerAuth(this.options.logLevel);
            
            try {
                // Inițializăm browserul Puppeteer
                await puppeteerAuth.initialize();
                
                // Obținem codul QR
                const { qrData, credentials: partialCredentials } = await puppeteerAuth.getQRCode();
                
                // Generăm și emitem codul QR pentru scanare
                const qrCode = await generateQRCode(qrData);
                this.emit('qr', qrCode, qrData);
                this.logger.info('Cod QR generat, așteaptă scanarea cu telefonul...');
                
                // Așteptăm scanarea codului QR și autentificarea
                const fullCredentials = await puppeteerAuth.waitForAuthentication();
                
                // Salvăm credențialele pentru reconectare
                this.credentials = fullCredentials;
                
                // Actualizăm starea și emitem evenimentele
                this.state = 'connected';
                this.emit('authenticated');
                this.emit('ready');
                
                this.logger.info('Autentificare cu Puppeteer reușită!');
                return;
            } catch (puppeteerError) {
                // În caz că Puppeteer eșuează din cauza dependențelor lipsă
                this.logger.error('Puppeteer nu a putut fi inițializat:', puppeteerError);
                this.logger.info('Încercăm metoda de autentificare de rezervă...');
                
                // Folosim metoda de rezervă
                await this.authenticateWithFallback();
            }
        } catch (error) {
            this.logger.error('Autentificare cu Puppeteer eșuată:', error);
            this.state = 'disconnected';
            this.emit('auth_failure', error);
            throw error;
        }
    }
    
    /**
     * Metodă de rezervă pentru autentificare când Puppeteer nu este disponibil
     * Aceasta este doar pentru demonstrație și nu va funcționa cu WhatsApp real
     */
    private async authenticateWithFallback(): Promise<void> {
        try {
            this.logger.warn('Folosesc metoda de autentificare de rezervă!');
            this.logger.warn('Această metodă nu va funcționa cu WhatsApp Web real.');
            this.logger.warn('Este doar pentru demonstrație sau dezvoltare.');
            
            const fallbackAuth = new FallbackAuth(this.options.logLevel);
            
            // Obținem un cod QR demo (nu este unul real)
            const { qrData } = await fallbackAuth.authenticate();
            
            // Generăm și emitem codul QR pentru demonstrație
            const qrCode = await generateQRCode(qrData);
            this.emit('qr', qrCode, qrData);
            
            // Așteptăm o simulare de autentificare
            const demoCredentials = await fallbackAuth.waitForAuthentication();
            
            // Salvăm credențialele demo
            this.credentials = demoCredentials;
            
            // Actualizăm starea și emitem evenimentele
            this.state = 'connected';
            this.emit('authenticated');
            this.emit('ready');
            
            this.logger.info('Autentificare de rezervă completă (doar demo)!');
        } catch (error) {
            this.logger.error('Autentificare de rezervă eșuată:', error);
            throw error;
        }
    }
    
    /**
     * Disconnect from WhatsApp Web
     */
    async disconnect(): Promise<void> {
        try {
            this.logger.info('Disconnecting from WhatsApp Web...');
            await this.connection.disconnect();
            this.state = 'disconnected';
            this.emit('disconnected');
        } catch (error) {
            this.logger.error('Disconnect failed:', error);
            throw error;
        }
    }
    
    /**
     * Send a text message
     * @param to Recipient's phone number
     * @param text Message text
     */
    async sendTextMessage(to: string, text: string): Promise<Message> {
        this.assertConnected();
        return await this.messageHandler.sendText(to, text);
    }
    
    /**
     * Send an image message
     * @param to Recipient's phone number
     * @param image Image buffer or URL
     * @param caption Optional caption
     */
    async sendImageMessage(to: string, image: Buffer | string, caption?: string): Promise<Message> {
        this.assertConnected();
        return await this.mediaHandler.sendImage(to, image, caption);
    }
    
    /**
     * Send a document
     * @param to Recipient's phone number
     * @param document Document buffer or URL
     * @param filename Filename
     * @param caption Optional caption
     */
    async sendDocument(to: string, document: Buffer | string, filename: string, caption?: string): Promise<Message> {
        this.assertConnected();
        return await this.mediaHandler.sendDocument(to, document, filename, caption);
    }
    
    /**
     * Create a group
     * @param name Group name
     * @param participants Array of participant phone numbers
     */
    async createGroup(name: string, participants: string[]): Promise<{ id: string, participants: string[] }> {
        this.assertConnected();
        return await this.groupHandler.createGroup(name, participants);
    }
    
    /**
     * Add participants to a group
     * @param groupId Group ID
     * @param participants Array of participant phone numbers
     */
    async addGroupParticipants(groupId: string, participants: string[]): Promise<{ added: string[], failed: string[] }> {
        this.assertConnected();
        return await this.groupHandler.addParticipants(groupId, participants);
    }
    
    /**
     * Remove participants from a group
     * @param groupId Group ID
     * @param participants Array of participant phone numbers
     */
    async removeGroupParticipants(groupId: string, participants: string[]): Promise<{ removed: string[], failed: string[] }> {
        this.assertConnected();
        return await this.groupHandler.removeParticipants(groupId, participants);
    }
    
    /**
     * Get connection state
     */
    getState(): ConnectionState {
        return this.state;
    }
    
    /**
     * Get current credentials
     */
    getCredentials(): AuthenticationCredentials | undefined {
        return this.credentials;
    }
    
    /**
     * Assert that client is connected
     */
    private assertConnected(): void {
        if (this.state !== 'connected') {
            throw new Error('Client is not connected to WhatsApp');
        }
    }
    
    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        this.connection.on('open', () => {
            this.state = 'connected';
            this.emit('ready');
        });
        
        this.connection.on('close', async (reason) => {
            this.state = 'disconnected';
            this.emit('disconnected', reason);
            
            // Try to reconnect if enabled
            if (this.options.restartOnConnectionLost) {
                await this.handleReconnection();
            }
        });
        
        this.connection.on('message', (message) => {
            this.emit('message', message);
        });
        
        this.connection.on('message_create', (message) => {
            this.emit('message_create', message);
        });
        
        this.connection.on('message_revoke', (data) => {
            this.emit('message_revoke', data);
        });
        
        this.connection.on('group_update', (update) => {
            this.emit('group_update', update);
        });
        
        this.connection.on('presence_update', (update) => {
            this.emit('presence_update', update);
        });
    }
    
    /**
     * Handle reconnection logic
     */
    private async handleReconnection(): Promise<void> {
        if (!this.credentials) {
            this.logger.warn('Cannot reconnect: No credentials available');
            return;
        }
        
        let attempts = 0;
        
        while (attempts < this.options.maxReconnectAttempts) {
            try {
                attempts++;
                this.logger.info(`Reconnection attempt ${attempts}/${this.options.maxReconnectAttempts}`);
                this.emit('reconnecting', attempts);
                
                await delay(this.options.reconnectInterval);
                await this.connect(this.credentials);
                
                this.logger.info('Reconnected successfully');
                this.emit('reconnected');
                return;
            } catch (error) {
                this.logger.error(`Reconnection attempt ${attempts} failed:`, error);
            }
        }
        
        this.logger.error('Maximum reconnection attempts reached');
        this.emit('reconnect_failed');
    }
}
