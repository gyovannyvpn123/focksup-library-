/**
 * Handler for WhatsApp media messages
 */

import { WAConnection } from './WAConnection';
import { Message, MessageType, MediaUploadOptions } from './Types';
import { validatePhoneNumber, generateRandomId, bufferToBase64, getWhatsAppFileType } from './Utils';
import { createLogger } from './Utils';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

export class MediaHandler {
    private connection: WAConnection;
    private logger: ReturnType<typeof createLogger>;
    
    constructor(connection: WAConnection) {
        this.connection = connection;
        this.logger = createLogger('MediaHandler');
    }
    
    /**
     * Send an image message
     * @param to Recipient's phone number
     * @param image Image buffer or URL
     * @param caption Optional caption
     */
    async sendImage(to: string, image: Buffer | string, caption?: string): Promise<Message> {
        try {
            const jid = validatePhoneNumber(to);
            const messageId = generateRandomId();
            const timestamp = Date.now();
            
            // Get image data as buffer
            const imageBuffer = await this.getMediaAsBuffer(image);
            
            // Upload the image to WhatsApp servers
            const uploadResult = await this.uploadMedia(imageBuffer, {
                filename: 'image.jpg',
                mimetype: 'image/jpeg'
            });
            
            // Send the message with the uploaded media
            await this.connection.sendRequest({
                type: 'message',
                data: {
                    jid,
                    type: 'image',
                    content: {
                        url: uploadResult.url,
                        caption: caption || ''
                    },
                    id: messageId
                }
            });
            
            this.logger.info(`Sent image message to ${jid}${caption ? ` with caption: ${caption}` : ''}`);
            
            return {
                id: messageId,
                from: 'me',
                to: jid,
                fromMe: true,
                timestamp,
                type: MessageType.IMAGE,
                caption,
                url: uploadResult.url,
                mimetype: 'image/jpeg'
            };
        } catch (error) {
            this.logger.error('Failed to send image message:', error);
            throw error;
        }
    }
    
    /**
     * Send a video message
     * @param to Recipient's phone number
     * @param video Video buffer or URL
     * @param caption Optional caption
     */
    async sendVideo(to: string, video: Buffer | string, caption?: string): Promise<Message> {
        try {
            const jid = validatePhoneNumber(to);
            const messageId = generateRandomId();
            const timestamp = Date.now();
            
            // Get video data as buffer
            const videoBuffer = await this.getMediaAsBuffer(video);
            
            // Upload the video to WhatsApp servers
            const uploadResult = await this.uploadMedia(videoBuffer, {
                filename: 'video.mp4',
                mimetype: 'video/mp4'
            });
            
            // Send the message with the uploaded media
            await this.connection.sendRequest({
                type: 'message',
                data: {
                    jid,
                    type: 'video',
                    content: {
                        url: uploadResult.url,
                        caption: caption || ''
                    },
                    id: messageId
                }
            });
            
            this.logger.info(`Sent video message to ${jid}${caption ? ` with caption: ${caption}` : ''}`);
            
            return {
                id: messageId,
                from: 'me',
                to: jid,
                fromMe: true,
                timestamp,
                type: MessageType.VIDEO,
                caption,
                url: uploadResult.url,
                mimetype: 'video/mp4'
            };
        } catch (error) {
            this.logger.error('Failed to send video message:', error);
            throw error;
        }
    }
    
    /**
     * Send an audio message
     * @param to Recipient's phone number
     * @param audio Audio buffer or URL
     */
    async sendAudio(to: string, audio: Buffer | string, options: { ptt?: boolean } = {}): Promise<Message> {
        try {
            const jid = validatePhoneNumber(to);
            const messageId = generateRandomId();
            const timestamp = Date.now();
            
            // Get audio data as buffer
            const audioBuffer = await this.getMediaAsBuffer(audio);
            
            // Upload the audio to WhatsApp servers
            const uploadResult = await this.uploadMedia(audioBuffer, {
                filename: 'audio.mp3',
                mimetype: 'audio/mp3'
            });
            
            // Send the message with the uploaded media
            await this.connection.sendRequest({
                type: 'message',
                data: {
                    jid,
                    type: options.ptt ? 'ptt' : 'audio', // ptt = push to talk (voice note)
                    content: {
                        url: uploadResult.url
                    },
                    id: messageId
                }
            });
            
            this.logger.info(`Sent ${options.ptt ? 'voice note' : 'audio message'} to ${jid}`);
            
            return {
                id: messageId,
                from: 'me',
                to: jid,
                fromMe: true,
                timestamp,
                type: MessageType.AUDIO,
                url: uploadResult.url,
                mimetype: 'audio/mp3'
            };
        } catch (error) {
            this.logger.error('Failed to send audio message:', error);
            throw error;
        }
    }
    
    /**
     * Send a document message
     * @param to Recipient's phone number
     * @param document Document buffer or URL
     * @param filename Filename
     * @param caption Optional caption
     */
    async sendDocument(to: string, document: Buffer | string, filename: string, caption?: string): Promise<Message> {
        try {
            const jid = validatePhoneNumber(to);
            const messageId = generateRandomId();
            const timestamp = Date.now();
            
            // Get document data as buffer
            const documentBuffer = await this.getMediaAsBuffer(document);
            
            // Get mimetype from filename
            const mimetype = this.getMimetypeFromFilename(filename);
            
            // Upload the document to WhatsApp servers
            const uploadResult = await this.uploadMedia(documentBuffer, {
                filename,
                mimetype
            });
            
            // Send the message with the uploaded media
            await this.connection.sendRequest({
                type: 'message',
                data: {
                    jid,
                    type: 'document',
                    content: {
                        url: uploadResult.url,
                        filename,
                        mimetype,
                        caption: caption || ''
                    },
                    id: messageId
                }
            });
            
            this.logger.info(`Sent document "${filename}" to ${jid}${caption ? ` with caption: ${caption}` : ''}`);
            
            return {
                id: messageId,
                from: 'me',
                to: jid,
                fromMe: true,
                timestamp,
                type: MessageType.DOCUMENT,
                filename,
                caption,
                url: uploadResult.url,
                mimetype
            };
        } catch (error) {
            this.logger.error('Failed to send document message:', error);
            throw error;
        }
    }
    
    /**
     * Send a sticker message
     * @param to Recipient's phone number
     * @param sticker Sticker buffer or URL
     */
    async sendSticker(to: string, sticker: Buffer | string): Promise<Message> {
        try {
            const jid = validatePhoneNumber(to);
            const messageId = generateRandomId();
            const timestamp = Date.now();
            
            // Get sticker data as buffer
            const stickerBuffer = await this.getMediaAsBuffer(sticker);
            
            // Upload the sticker to WhatsApp servers
            const uploadResult = await this.uploadMedia(stickerBuffer, {
                mimetype: 'image/webp'
            });
            
            // Send the message with the uploaded media
            await this.connection.sendRequest({
                type: 'message',
                data: {
                    jid,
                    type: 'sticker',
                    content: {
                        url: uploadResult.url
                    },
                    id: messageId
                }
            });
            
            this.logger.info(`Sent sticker to ${jid}`);
            
            return {
                id: messageId,
                from: 'me',
                to: jid,
                fromMe: true,
                timestamp,
                type: MessageType.STICKER,
                url: uploadResult.url,
                mimetype: 'image/webp'
            };
        } catch (error) {
            this.logger.error('Failed to send sticker message:', error);
            throw error;
        }
    }
    
    /**
     * Download media from a message
     * @param message Message with media
     */
    async downloadMedia(message: Message): Promise<Buffer> {
        try {
            if (!message.url) {
                throw new Error('Message does not contain media URL');
            }
            
            const response = await fetch(message.url);
            if (!response.ok) {
                throw new Error(`Failed to download media: ${response.statusText}`);
            }
            
            const buffer = await response.buffer();
            this.logger.info(`Downloaded media from ${message.url}`);
            
            return buffer;
        } catch (error) {
            this.logger.error('Failed to download media:', error);
            throw error;
        }
    }
    
    /**
     * Upload media to WhatsApp servers
     * @param buffer Media buffer
     * @param options Upload options
     */
    private async uploadMedia(buffer: Buffer, options: MediaUploadOptions = {}): Promise<{ url: string }> {
        try {
            // Get file type from mimetype or filename
            const fileType = options.mimetype 
                ? getWhatsAppFileType(options.mimetype) 
                : options.filename 
                    ? getWhatsAppFileType(this.getMimetypeFromFilename(options.filename))
                    : 'document';
            
            // Convert buffer to base64 for sending
            const base64Data = bufferToBase64(buffer);
            
            // Request upload URL and token
            const uploadRequest = await this.connection.sendRequest({
                type: 'media_upload_request',
                data: {
                    fileType,
                    fileSize: buffer.length,
                    mimetype: options.mimetype,
                    filename: options.filename
                }
            });
            
            // Upload media with the obtained URL and token
            await this.connection.sendRequest({
                type: 'media_upload',
                data: {
                    url: uploadRequest.uploadUrl,
                    token: uploadRequest.token,
                    media: base64Data,
                    mimetype: options.mimetype
                }
            });
            
            this.logger.info(`Uploaded ${fileType} to WhatsApp servers`);
            
            return { url: uploadRequest.mediaUrl };
        } catch (error) {
            this.logger.error('Failed to upload media:', error);
            throw error;
        }
    }
    
    /**
     * Get media as buffer from various sources
     * @param media Buffer or URL or file path
     */
    private async getMediaAsBuffer(media: Buffer | string): Promise<Buffer> {
        // If already a buffer, return it
        if (Buffer.isBuffer(media)) {
            return media;
        }
        
        // If URL, download it
        if (media.startsWith('http://') || media.startsWith('https://')) {
            const response = await fetch(media);
            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.statusText}`);
            }
            return await response.buffer();
        }
        
        // Assume it's a file path
        try {
            return fs.readFileSync(media);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to read file: ${errorMessage}`);
        }
    }
    
    /**
     * Get MIME type from filename
     * @param filename Filename
     */
    private getMimetypeFromFilename(filename: string): string {
        const extension = path.extname(filename).toLowerCase();
        
        const mimeTypes: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.mp4': 'video/mp4',
            '.mp3': 'audio/mpeg',
            '.ogg': 'audio/ogg',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.zip': 'application/zip',
            '.txt': 'text/plain'
        };
        
        return mimeTypes[extension] || 'application/octet-stream';
    }
}
