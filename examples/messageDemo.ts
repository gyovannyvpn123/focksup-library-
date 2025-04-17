/**
 * Demo complet pentru conectare cu cod de asociere și trimitere mesaje
 * cu biblioteca Focksup
 */

import { FocksupClient } from '../src';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Creează o interfață readline pentru input utilizator
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Functie pentru a pune întrebări utilizatorului
const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
};

// Calea fișierului de sesiune pentru stocarea credențialelor
const SESSION_FILE_PATH = path.join(__dirname, 'message-demo-session.json');

// Creează un nou client
const client = new FocksupClient({
    logLevel: 'info'
});

// Încarcă sesiunea
const loadSession = () => {
    if (fs.existsSync(SESSION_FILE_PATH)) {
        const sessionData = fs.readFileSync(SESSION_FILE_PATH, 'utf8');
        console.log('Sesiune găsită. Se încearcă reconectarea...');
        return JSON.parse(sessionData);
    }
    console.log('Nu s-a găsit nicio sesiune salvată.');
    return null;
};

// Salvează sesiunea
const saveSession = (session: any) => {
    fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session), 'utf8');
    console.log('Sesiune salvată în', SESSION_FILE_PATH);
};

// Gestionarea evenimentelor
client.on('pairing_code', (code) => {
    console.log('---------------------------------------');
    console.log(`Codul tău de asociere: ${code}`);
    console.log('Introdu acest cod în WhatsApp > Dispozitive conectate > Conectează un dispozitiv');
    console.log('---------------------------------------');
});

client.on('authenticated', () => {
    console.log('Autentificat cu succes!');
    
    // Salvează sesiunea pentru utilizare ulterioară
    const credentials = client.getCredentials();
    if (credentials) {
        saveSession(credentials);
    }
});

client.on('ready', async () => {
    console.log('Clientul este pregătit!');
    await showMenu();
});

client.on('message', (message) => {
    if (!message.fromMe) {
        console.log('\n---------------------------------------');
        console.log(`Mesaj primit de la: ${message.from}`);
        console.log(`Conținut: ${message.body}`);
        console.log('---------------------------------------');
    }
});

client.on('disconnected', (reason) => {
    console.log('Clientul a fost deconectat:', reason);
});

// Funcție pentru a formata numărul de telefon
const formatPhoneNumber = (number: string): string => {
    // Elimină orice caracter non-numeric
    let cleaned = number.replace(/\D/g, '');
    
    // Elimină prefixul "+" dacă există
    if (cleaned.startsWith('0')) {
        cleaned = '4' + cleaned;
    }
    
    // Asigură-te că numărul are formatul corect pentru WhatsApp (CCXXXXXXXXXX)
    return cleaned.includes('@') ? cleaned : `${cleaned}@s.whatsapp.net`;
};

// Funcție pentru a trimite mesaj text
const sendTextMessage = async () => {
    try {
        const recipient = await question('Introdu numărul de telefon al destinatarului (ex: 07xxxxxxxx sau grupul ID): ');
        const message = await question('Introdu mesajul: ');
        
        const formattedRecipient = formatPhoneNumber(recipient);
        console.log(`Se trimite mesaj către ${formattedRecipient}...`);
        
        await client.sendTextMessage(formattedRecipient, message);
        console.log('Mesaj trimis cu succes!');
    } catch (error) {
        console.error('Eroare la trimiterea mesajului:', error);
    }
    
    await showMenu();
};

// Funcție pentru a trimite mesaj imagine
const sendImageMessage = async () => {
    try {
        const recipient = await question('Introdu numărul de telefon al destinatarului (ex: 07xxxxxxxx sau grupul ID): ');
        const imageUrl = await question('Introdu URL-ul imaginii: ');
        const caption = await question('Introdu descrierea (opțional, apasă Enter pentru a sări): ');
        
        const formattedRecipient = formatPhoneNumber(recipient);
        console.log(`Se trimite imagine către ${formattedRecipient}...`);
        
        await client.sendImageMessage(formattedRecipient, imageUrl, caption || undefined);
        console.log('Imagine trimisă cu succes!');
    } catch (error) {
        console.error('Eroare la trimiterea imaginii:', error);
    }
    
    await showMenu();
};

// Funcție pentru a trimite document
const sendDocumentMessage = async () => {
    try {
        const recipient = await question('Introdu numărul de telefon al destinatarului (ex: 07xxxxxxxx sau grupul ID): ');
        const documentUrl = await question('Introdu URL-ul documentului: ');
        const filename = await question('Introdu numele fișierului: ');
        const caption = await question('Introdu descrierea (opțional, apasă Enter pentru a sări): ');
        
        const formattedRecipient = formatPhoneNumber(recipient);
        console.log(`Se trimite document către ${formattedRecipient}...`);
        
        await client.sendDocument(formattedRecipient, documentUrl, filename, caption || undefined);
        console.log('Document trimis cu succes!');
    } catch (error) {
        console.error('Eroare la trimiterea documentului:', error);
    }
    
    await showMenu();
};

// Meniu principal
const showMenu = async () => {
    console.log('\n===== MENIU FOCKSUP =====');
    console.log('1. Trimite mesaj text');
    console.log('2. Trimite imagine');
    console.log('3. Trimite document');
    console.log('4. Ieșire');
    console.log('========================\n');
    
    const choice = await question('Alege o opțiune (1-4): ');
    
    switch (choice) {
        case '1':
            await sendTextMessage();
            break;
        case '2':
            await sendImageMessage();
            break;
        case '3':
            await sendDocumentMessage();
            break;
        case '4':
            console.log('Se închide aplicația...');
            await client.disconnect();
            process.exit(0);
            break;
        default:
            console.log('Opțiune invalidă, încearcă din nou.');
            await showMenu();
            break;
    }
};

// Conectare la WhatsApp
async function startClient() {
    try {
        // Verifică dacă avem date de sesiune
        const session = loadSession();
        
        if (session) {
            // Conectare cu sesiunea salvată
            console.log('Se conectează cu sesiunea salvată...');
            await client.connect(session);
        } else {
            // Nu există sesiune, conectare și autentificare
            console.log('Nu s-a găsit nicio sesiune salvată, se conectează...');
            await client.connect();
            
            // Solicită metoda de autentificare
            console.log('Alege metoda de autentificare:');
            console.log('1. Cod de asociere (Pairing Code)');
            console.log('2. Cod QR');
            
            const authMethod = await question('Introdu opțiunea (1/2): ');
            
            if (authMethod === '1') {
                try {
                    const phoneNumber = await question('Introdu numărul tău de telefon (format internațional, ex: +40722123456): ');
                    // Vom implementa autentificarea cu număr de telefon în curând
                    await client.authenticateWithPairingCode();
                } catch (error) {
                    console.error('Eroare la autentificarea cu cod de asociere:', error);
                }
            } else {
                try {
                    console.log('Scanează codul QR pentru a te autentifica:');
                    await client.authenticateWithQR();
                } catch (error) {
                    console.error('Eroare la autentificarea cu cod QR:', error);
                }
            }
        }
    } catch (error) {
        console.error('Eroare la pornirea clientului:', error);
    }
}

// Pornește clientul
startClient();

// Gestionează ieșirea
process.on('SIGINT', async () => {
    console.log('Se deconectează...');
    rl.close();
    await client.disconnect();
    process.exit(0);
});