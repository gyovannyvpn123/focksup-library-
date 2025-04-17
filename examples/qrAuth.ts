/**
 * Example of QR code authentication with Focksup Library
 */

import { FocksupClient } from '../src';
import fs from 'fs';
import path from 'path';

// Session file path for storing credentials
const SESSION_FILE_PATH = path.join(__dirname, 'session.json');

// Create a new client
const client = new FocksupClient({
    logLevel: 'info'
});

// Load session
const loadSession = () => {
    if (fs.existsSync(SESSION_FILE_PATH)) {
        const sessionData = fs.readFileSync(SESSION_FILE_PATH, 'utf8');
        return JSON.parse(sessionData);
    }
    return null;
};

// Save session
const saveSession = (session) => {
    fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session), 'utf8');
    console.log('Session saved to', SESSION_FILE_PATH);
};

// Event handling
client.on('qr', (qrCode) => {
    console.log('Scan this QR code with your WhatsApp to log in:');
    // QR code is already printed to terminal by the library
});

client.on('authenticated', () => {
    console.log('Authenticated successfully!');
    
    // Save session for later use
    const credentials = client.getCredentials();
    if (credentials) {
        saveSession(credentials);
    }
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', (message) => {
    console.log('Received message:', message);
    
    if (!message.fromMe) {
        // Reply to every message with the same text
        client.sendTextMessage(message.from, `You said: ${message.body}`)
            .catch(err => console.error('Failed to send reply:', err));
    }
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected:', reason);
});

// Connect to WhatsApp
async function startClient() {
    try {
        // Check if we have session data
        const session = loadSession();
        
        if (session) {
            // Connect with saved session
            console.log('Connecting with saved session...');
            await client.connect(session);
        } else {
            // No session, connect with QR login
            console.log('No saved session found, using QR code...');
            await client.connect();
            await client.authenticateWithQR();
        }
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
