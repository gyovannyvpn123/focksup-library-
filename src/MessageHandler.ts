/**
 * Handler for WhatsApp messages
 */

import { WAConnection } from './WAConnection';
import { Message, MessageSendOptions, MessageType } from './Types';
import { validatePhoneNumber, generateRandomId, formatTimestamp } from './Utils';
import { createLogger } from './Utils';

export class MessageHandler {
    private connection: WAConnection;
    private logger: ReturnType<typeof createLogger>;
    
    constructor(connection: WAConnection) {
        this.connection = connection;
        this.logger = createLogger('MessageHandler');
    }
    
    /**
     * Send a text message
     * @param to Recipient's phone number
     * @param text Message text
     * @param options Send options
     */
    async sendText(to: string, text: string, options: MessageSendOptions = {}): Promise<Message> {
        try {
            const jid = validatePhoneNumber(to);
            const messageId = generateRandomId();
            const timestamp = Date.now();
            
            const message = {
                id: messageId,
                type: MessageType.TEXT,
                from: 'me',
                to: jid,
                fromMe: true,
                body: text,
                timestamp
            };
            
            await this.connection.sendRequest({
                type: 'message',
                data: {
                    jid,
                    type: 'text',
                    content: text,
                    id: messageId,
                    options
                }
            });
            
            this.logger.info(`Sent text message to ${jid}: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`);
            
            return message;
        } catch (error) {
            this.logger.error('Failed to send text message:', error);
            throw error;
        }
    }
    
    /**
     * Send a reply to a message
     * @param to Recipient's phone number
     * @param text Reply text
     * @param quotedMessageId ID of the message to reply to
     * @param options Send options
     */
    async sendReply(to: string, text: string, quotedMessageId: string, options: MessageSendOptions = {}): Promise<Message> {
        try {
            const jid = validatePhoneNumber(to);
            const messageId = generateRandomId();
            const timestamp = Date.now();
            
            const message = {
                id: messageId,
                type: MessageType.TEXT,
                from: 'me',
                to: jid,
                fromMe: true,
                body: text,
                timestamp,
                quotedMessageId
            };
            
            await this.connection.sendRequest({
                type: 'message',
                data: {
                    jid,
                    type: 'text',
                    content: text,
                    id: messageId,
                    quotedMessageId,
                    options
                }
            });
            
            this.logger.info(`Sent reply to ${jid} (quoting ${quotedMessageId}): ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`);
            
            return message;
        } catch (error) {
            this.logger.error('Failed to send reply:', error);
            throw error;
        }
    }
    
    /**
     * Send a message with mentions
     * @param to Recipient's phone number
     * @param text Message text with mentions (@mention)
     * @param mentionedJids Array of JIDs to mention
     * @param options Send options
     */
    async sendTextWithMentions(to: string, text: string, mentionedJids: string[], options: MessageSendOptions = {}): Promise<Message> {
        try {
            const jid = validatePhoneNumber(to);
            const messageId = generateRandomId();
            const timestamp = Date.now();
            
            const message = {
                id: messageId,
                type: MessageType.TEXT,
                from: 'me',
                to: jid,
                fromMe: true,
                body: text,
                timestamp,
                mentionedJids
            };
            
            await this.connection.sendRequest({
                type: 'message',
                data: {
                    jid,
                    type: 'text',
                    content: text,
                    id: messageId,
                    mentionedJids,
                    options
                }
            });
            
            this.logger.info(`Sent text message with mentions to ${jid}: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`);
            
            return message;
        } catch (error) {
            this.logger.error('Failed to send text message with mentions:', error);
            throw error;
        }
    }
    
    /**
     * Mark a chat as read
     * @param jid JID of the chat
     * @param messageId ID of the last message to mark as read
     */
    async markChatAsRead(jid: string, messageId: string): Promise<void> {
        try {
            await this.connection.sendRequest({
                type: 'read',
                data: {
                    jid,
                    messageId
                }
            });
            
            this.logger.info(`Marked chat ${jid} as read up to message ${messageId}`);
        } catch (error) {
            this.logger.error('Failed to mark chat as read:', error);
            throw error;
        }
    }
    
    /**
     * Send a "typing" indication
     * @param jid JID to send typing indication to
     * @param durationMs How long to show typing (ms)
     */
    async sendTyping(jid: string, durationMs: number = 3000): Promise<void> {
        try {
            await this.connection.sendRequest({
                type: 'presence',
                data: {
                    jid,
                    presence: 'composing'
                }
            });
            
            // Automatically stop typing after the specified duration
            setTimeout(async () => {
                try {
                    await this.connection.sendRequest({
                        type: 'presence',
                        data: {
                            jid,
                            presence: 'paused'
                        }
                    });
                } catch (error) {
                    this.logger.error('Failed to stop typing indication:', error);
                }
            }, durationMs);
            
            this.logger.info(`Sent typing indication to ${jid} for ${durationMs}ms`);
        } catch (error) {
            this.logger.error('Failed to send typing indication:', error);
            throw error;
        }
    }
    
    /**
     * Update online presence
     * @param presence Presence status ('available' or 'unavailable')
     */
    async updatePresence(presence: 'available' | 'unavailable'): Promise<void> {
        try {
            await this.connection.sendRequest({
                type: 'presence',
                data: {
                    presence
                }
            });
            
            this.logger.info(`Updated presence to ${presence}`);
        } catch (error) {
            this.logger.error('Failed to update presence:', error);
            throw error;
        }
    }
    
    /**
     * Delete a message
     * @param jid JID where the message is
     * @param messageId ID of the message to delete
     * @param forEveryone Whether to delete for everyone or just for me
     */
    async deleteMessage(jid: string, messageId: string, forEveryone: boolean = false): Promise<void> {
        try {
            await this.connection.sendRequest({
                type: 'message_delete',
                data: {
                    jid,
                    messageId,
                    forEveryone
                }
            });
            
            this.logger.info(`Deleted message ${messageId} from ${jid} (for ${forEveryone ? 'everyone' : 'me'})`);
        } catch (error) {
            this.logger.error('Failed to delete message:', error);
            throw error;
        }
    }
}
