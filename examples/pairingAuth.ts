/**
 * Example of pairing code authentication with Focksup Library
 */

import { FocksupClient } from '../src';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Session file path for storing credentials
const SESSION_FILE_PATH = path.join(__dirname, 'pairing-session.json');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
client.on('pairing_code', (code) => {
    console.log('---------------------------------------');
    console.log(`Your pairing code: ${code}`);
    console.log('Enter this code in WhatsApp > Linked Devices > Link a Device');
    console.log('---------------------------------------');
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
        // Echo back the message
        client.sendTextMessage(message.from, `Echo: ${message.body}`)
            .catch(err => console.error('Failed to send reply:', err));
    }
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected:', reason);
});

client.on('auth_method_required', async () => {
    console.log('Select authentication method:');
    console.log('1. Pairing Code');
    console.log('2. QR Code');
    
    rl.question('Enter option (1/2): ', async (answer) => {
        if (answer === '1') {
            try {
                await client.authenticateWithPairingCode();
            } catch (error) {
                console.error('Failed to authenticate with pairing code:', error);
            }
        } else {
            try {
                await client.authenticateWithQR();
            } catch (error) {
                console.error('Failed to authenticate with QR code:', error);
            }
        }
    });
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
            // No session, connect and authenticate
            console.log('No saved session found, connecting...');
            await client.connect();
            
            // Authentication method will be selected via event
        }
    } catch (error) {
        console.error('Failed to start client:', error);
    }
}

startClient();

// Handle exit
process.on('SIGINT', async () => {
    console.log('Disconnecting...');
    rl.close();
    await client.disconnect();
    process.exit(0);
});
