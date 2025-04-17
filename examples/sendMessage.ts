/**
 * Example of sending different message types with Focksup Library
 */

import { FocksupClient } from '../src';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ask for user input
const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
};

// Create a new client
const client = new FocksupClient({
    logLevel: 'info'
});

// Event handling
client.on('qr', (qrCode) => {
    console.log('Scan this QR code with your WhatsApp to log in:');
    // QR code is already printed to terminal by the library
});

client.on('ready', () => {
    console.log('Client is ready!');
    runMessageDemo();
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected:', reason);
    process.exit(1);
});

// Connect to WhatsApp
async function start() {
    try {
        await client.connect();
        await client.authenticateWithQR();
    } catch (error) {
        console.error('Failed to start client:', error);
        process.exit(1);
    }
}

// Run the message demo
async function runMessageDemo() {
    try {
        // Ask for recipient
        const recipient = await question('Enter recipient phone number: ');
        
        // Show message type options
        console.log('\nSelect message type:');
        console.log('1. Text Message');
        console.log('2. Image Message');
        console.log('3. Document Message');
        
        const choice = await question('Enter your choice (1-3): ');
        
        switch (choice) {
            case '1':
                await sendTextMessage(recipient);
                break;
            case '2':
                await sendImageMessage(recipient);
                break;
            case '3':
                await sendDocumentMessage(recipient);
                break;
            default:
                console.log('Invalid choice. Exiting...');
        }
        
        // Ask if user wants to send another message
        const another = await question('\nSend another message? (y/n): ');
        if (another.toLowerCase() === 'y') {
            await runMessageDemo();
        } else {
            await client.disconnect();
            rl.close();
            process.exit(0);
        }
    } catch (error) {
        console.error('Error in message demo:', error);
        await client.disconnect();
        rl.close();
        process.exit(1);
    }
}

// Send a text message
async function sendTextMessage(recipient: string) {
    const text = await question('Enter message text: ');
    console.log('Sending text message...');
    
    try {
        const result = await client.sendTextMessage(recipient, text);
        console.log('Message sent successfully!', result.id);
    } catch (error) {
        console.error('Failed to send text message:', error);
    }
}

// Send an image message
async function sendImageMessage(recipient: string) {
    const imagePath = await question('Enter image path or URL: ');
    const caption = await question('Enter caption (optional): ');
    
    console.log('Sending image message...');
    
    try {
        const result = await client.sendImageMessage(recipient, imagePath, caption);
        console.log('Image sent successfully!', result.id);
    } catch (error) {
        console.error('Failed to send image message:', error);
    }
}

// Send a document message
async function sendDocumentMessage(recipient: string) {
    const filePath = await question('Enter document path or URL: ');
    const filename = await question('Enter filename: ');
    const caption = await question('Enter caption (optional): ');
    
    console.log('Sending document message...');
    
    try {
        const result = await client.sendDocument(recipient, filePath, filename, caption);
        console.log('Document sent successfully!', result.id);
    } catch (error) {
        console.error('Failed to send document message:', error);
    }
}

// Start the client
start();

// Handle exit
process.on('SIGINT', async () => {
    console.log('Disconnecting...');
    rl.close();
    await client.disconnect();
    process.exit(0);
});
