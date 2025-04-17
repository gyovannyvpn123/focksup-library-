/**
 * Exemplu simplu de utilizare a bibliotecii Focksup
 */

const { FocksupClient } = require('../dist/src');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Calea fișierului de sesiune pentru stocarea credențialelor
const SESSION_FILE_PATH = path.join(__dirname, 'simple-session.json');

// Salvează sesiunea
const saveSession = (session) => {
    fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session), 'utf8');
    console.log('Sesiune salvată în', SESSION_FILE_PATH);
};

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

// Creează un nou client
const client = new FocksupClient({
    logLevel: 'info'
});

// Tratare evenimente
client.on('qr', (qrCode) => {
    console.log('Scanează acest cod QR cu WhatsApp de pe telefonul tău:');
    qrcode.generate(qrCode, { small: true });
});

client.on('ready', () => {
    console.log('Client este pregătit!');
    
    // Cerem numărul utilizatorului pentru a trimite un mesaj de test
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    readline.question('Introdu un număr de telefon pentru a trimite un mesaj de test (format: 07xxxxxxxx): ', (phoneNumber) => {
        // Formatam numărul pentru WhatsApp
        let formattedNumber = phoneNumber;
        if (!phoneNumber.includes('@')) {
            // Elimină caracterele non-numerice
            let cleaned = phoneNumber.replace(/\D/g, '');
            
            // Adaugă prefixul '4' dacă începe cu '0' (pentru România)
            if (cleaned.startsWith('0')) {
                cleaned = '4' + cleaned;
            }
            
            formattedNumber = `${cleaned}@s.whatsapp.net`;
        }
        
        client.sendTextMessage(formattedNumber, 'Salut! Acesta este un mesaj de test trimis cu biblioteca Focksup.')
            .then((msg) => {
                console.log('Mesaj trimis cu succes!', msg.id);
            })
            .catch((err) => {
                console.error('Eroare la trimiterea mesajului:', err);
            })
            .finally(() => {
                readline.close();
            });
    });
});

client.on('authenticated', () => {
    console.log('Autentificat cu succes!');
    
    // Salvează sesiunea pentru utilizare ulterioară
    const credentials = client.getCredentials();
    if (credentials) {
        saveSession(credentials);
    }
});

client.on('message', (message) => {
    if (!message.fromMe) {
        console.log('\n---------------------------------------');
        console.log(`Mesaj primit de la: ${message.from}`);
        console.log(`Conținut: ${message.body}`);
        console.log('---------------------------------------');
        
        // Răspunde automat la mesaje
        client.sendTextMessage(message.from, 'Am primit mesajul tău: ' + message.body)
            .catch(err => console.error('Eroare la trimiterea răspunsului:', err));
    }
});

client.on('disconnected', (reason) => {
    console.log('Clientul a fost deconectat:', reason);
});

// Conectare și folosire autentificare Puppeteer
async function startClient() {
    try {
        // Verifică dacă avem date de sesiune salvate
        const savedSession = loadSession();
        if (savedSession) {
            console.log('Încercăm să ne conectăm cu sesiunea salvată...');
            try {
                await client.connect(savedSession);
                return; // Dacă conectarea reușește, ieșim din funcție
            } catch (err) {
                console.log('Nu am putut folosi sesiunea salvată, încercăm autentificarea cu Puppeteer.');
                // Continuăm cu autentificarea prin Puppeteer
            }
        }
        
        console.log('Inițializez autentificarea cu Puppeteer...');
        // Folosim Puppeteer pentru a evita restricțiile WhatsApp
        await client.authenticateWithPuppeteer();
    } catch (error) {
        console.error('Eroare la startClient:', error);
    }
}

// Pornește clientul
startClient();

// Tratează închiderea aplicației
process.on('SIGINT', async () => {
    console.log('Se închide aplicația...');
    await client.disconnect();
    process.exit(0);
});