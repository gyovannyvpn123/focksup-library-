/**
 * Simple example of using Focksup Library
 */

import { FocksupClient } from '../src';

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
    
    // Send a message once connected
    client.sendTextMessage('1234567890', 'Hello from Focksup Library!')
        .then((msg) => {
            console.log('Message sent successfully!', msg.id);
        })
        .catch((err) => {
            console.error('Failed to send message:', err);
        });
});

client.on('message', (message) => {
    console.log('Received message:', message);
    
    // Auto-reply to messages
    if (!message.fromMe) {
        client.sendTextMessage(message.from, 'I received your message: ' + message.body)
            .catch(err => console.error('Error sending reply:', err));
    }
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected:', reason);
});

// Connect and use Puppeteer authentication instead of normal QR code
// This avoids WhatsApp Web restrictions on non-browser connections
async function startClient() {
    try {
        console.log('Starting client with Puppeteer authentication...');
        // Nu mai este nevoie să apelăm client.connect() aici deoarece
        // authenticateWithPuppeteer() gestionează tot procesul
        await client.authenticateWithPuppeteer();
    } catch (error) {
        console.error('Failed to start client:', error);
    }
}

startClient();

// Handle exit
process.on('SIGINT', async () => {
    console.log('Disconnecting...');
    await client.disconnect();
    process.exit(0);
});
