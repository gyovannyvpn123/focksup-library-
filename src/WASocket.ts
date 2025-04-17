/**
 * Socket implementation for WhatsApp Web connection
 */

import WebSocket from 'ws';
import EventEmitter from 'events';
import { createLogger } from './Utils';

export class WASocket extends EventEmitter {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectInterval = 3000;
    private url: string;
    private logger: ReturnType<typeof createLogger>;
    
    constructor(url: string, options: { logLevel?: string } = {}) {
        super();
        this.url = url;
        this.logger = createLogger('WASocket', options.logLevel);
    }
    
    /**
     * Open the WebSocket connection
     */
    open(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);
                
                this.ws.on('open', () => {
                    this.logger.info('WebSocket connection opened');
                    this.reconnectAttempts = 0;
                    this.emit('open');
                    resolve();
                });
                
                this.ws.on('message', (data) => {
                    this.handleMessage(data);
                });
                
                this.ws.on('close', (code, reason) => {
                    this.logger.info(`WebSocket connection closed: ${code} - ${reason}`);
                    this.handleClose(code, reason);
                });
                
                this.ws.on('error', (error) => {
                    this.logger.error('WebSocket error:', error);
                    this.emit('error', error);
                    reject(error);
                });
            } catch (error) {
                this.logger.error('Failed to open WebSocket:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Close the WebSocket connection
     */
    close(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.ws) {
                resolve();
                return;
            }
            
            if (this.ws.readyState === WebSocket.CLOSED) {
                this.ws = null;
                resolve();
                return;
            }
            
            this.ws.once('close', () => {
                this.ws = null;
                resolve();
            });
            
            this.ws.close();
        });
    }
    
    /**
     * Send data through the WebSocket
     */
    send(data: string | Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket is not open'));
                return;
            }
            
            this.ws.send(data, (error) => {
                if (error) {
                    this.logger.error('Failed to send message:', error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
    
    /**
     * Handle incoming messages
     */
    private handleMessage(data: WebSocket.Data): void {
        try {
            this.emit('message', data);
        } catch (error) {
            this.logger.error('Error handling message:', error);
        }
    }
    
    /**
     * Handle connection close
     */
    private handleClose(code: number, reason: string): void {
        const shouldReconnect = 
            code !== 1000 && // Normal closure
            code !== 1001 && // Going away
            this.reconnectAttempts < this.maxReconnectAttempts;
            
        if (shouldReconnect) {
            this.reconnectAttempts++;
            this.logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.open().catch((error) => {
                    this.logger.error('Reconnection failed:', error);
                });
            }, this.reconnectInterval);
        }
        
        this.emit('close', { code, reason, willReconnect: shouldReconnect });
    }
    
    /**
     * Check if socket is connected
     */
    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}
