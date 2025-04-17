/**
 * Exemplu de bot WhatsApp pentru Termux, optimizat pentru dispozitive mobile Android
 * Acest exemplu folosește opțiunea useFallbackAuth pentru a evita dependența de Puppeteer
 * 
 * NOTĂ: Această versiune este doar pentru demonstrație, deoarece Termux nu poate rula Puppeteer 
 * care este necesar pentru conexiunea reală la WhatsApp Web.
 */

// Importăm biblioteca Focksup
const { FocksupClient } = require('focksup-library');
const fs = require('fs');
const path = require('path');

// Setăm calea pentru fișierul de sesiune
const SESSION_FILE_PATH = path.join(__dirname, 'session.json');

// Funcții pentru salvarea și încărcarea sesiunii
const saveSession = (session) => {
    fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session), 'utf8');
    console.log('Sesiune salvată în', SESSION_FILE_PATH);
};

const loadSession = () => {
    if (fs.existsSync(SESSION_FILE_PATH)) {
        const sessionData = fs.readFileSync(SESSION_FILE_PATH, 'utf8');
        console.log('Sesiune găsită. Se încearcă reconectarea...');
        return JSON.parse(sessionData);
    }
    console.log('Nu s-a găsit nicio sesiune salvată.');
    return null;
};

// Creăm un client cu opțiunea useFallbackAuth activată pentru Termux
const client = new FocksupClient({
    logLevel: 'info',
    useFallbackAuth: true  // Această opțiune este esențială pentru Termux
});

// Setăm evenimentele
client.on('qr', (qrCode) => {
    console.log('==============================================');
    console.log('Cod QR generat pentru demonstrație:');
    console.log(qrCode);
    console.log('==============================================');
    console.log('NOTĂ: Acest cod QR este doar pentru demonstrație în Termux.');
    console.log('Pentru o conexiune reală, utilizați biblioteca pe un PC normal.');
});

client.on('pairing_code', (code) => {
    console.log('==============================================');
    console.log(`COD DE ASOCIERE PENTRU DEMO: ${code}`);
    console.log('==============================================');
    console.log('NOTĂ: Acest cod este doar pentru demonstrație în Termux.');
    console.log('Pe un PC real, introduceți acest cod în aplicația WhatsApp.');
});

client.on('authenticated', () => {
    console.log('Autentificat cu succes! (mod demonstrație)');
    
    // Salvăm sesiunea pentru utilizare ulterioară
    const credentials = client.getCredentials();
    if (credentials) {
        saveSession(credentials);
    }
});

client.on('ready', () => {
    console.log('Bot pregătit și online! (mod demonstrație)');
    console.log('Acum puteți experimenta funcționalitățile în acest mediu de demonstrație.');
    
    // Simulăm primirea unui mesaj
    simulateReceivedMessage();
});

// Ascultăm pentru mesaje
client.on('message', async (message) => {
    console.log(`Mesaj nou de la ${message.from}: ${message.body}`);
    
    // Răspundem la mesaje (demonstrație)
    try {
        if (message.body.toLowerCase() === 'salut') {
            console.log('Răspundem la salut...');
            await client.sendTextMessage(message.from, 'Bună ziua! Sunt un bot de demonstrație.');
        } 
        else if (message.body.toLowerCase() === 'ora') {
            console.log('Răspundem cu ora curentă...');
            const now = new Date().toLocaleString('ro-RO');
            await client.sendTextMessage(message.from, `Data și ora curentă: ${now}`);
        }
        else {
            console.log('Răspundem cu mesaj implicit...');
            await client.sendTextMessage(message.from, `Ai spus: ${message.body}`);
        }
    } catch (error) {
        console.error('Eroare la trimiterea răspunsului (așteptat în modul demo):', error.message);
    }
});

// Pornire client cu cod de asociere (pentru demonstrație în Termux)
async function startBot() {
    try {
        // Verificăm dacă avem o sesiune salvată
        const savedSession = loadSession();
        if (savedSession) {
            // Încercăm reconectarea cu sesiunea salvată
            console.log('Încercăm reconectarea cu sesiunea salvată...');
            await client.connect(savedSession);
        } else {
            // Inițiem autentificarea cu cod de asociere
            console.log('Inițiem autentificarea cu cod de asociere pentru Termux...');
            try {
                await client.authenticateWithPairingCode();
                console.log('Așteaptăm completarea autentificării demo...');
            } catch (error) {
                console.error('Eroare la autentificare (normal în modul demo):', error.message);
                console.log('Se încearcă metoda alternativă...');
                await client.authenticateWithPuppeteer();
            }
        }
    } catch (error) {
        console.error('Eroare la pornirea botului:', error);
    }
}

// Funcție pentru simularea unui mesaj primit (doar pentru demonstrație)
function simulateReceivedMessage() {
    setTimeout(() => {
        console.log('==============================================');
        console.log('SIMULARE: Se primește un mesaj nou...');
        
        const demoMessage = {
            id: 'demo-message-id-' + Date.now(),
            from: '40712345678@s.whatsapp.net',
            to: 'me@s.whatsapp.net',
            fromMe: false,
            timestamp: Date.now(),
            type: 'text',
            body: 'Salut de la Termux!'
        };
        
        client.emit('message', demoMessage);
        console.log('==============================================');
        
        // Oferim instrucțiuni utilizatorului
        console.log('\nComandă disponibilă: sendDemo');
        console.log('Scrieți "sendDemo" urmat de Enter pentru a simula trimiterea unui mesaj.\n');
    }, 3000);
    
    // Configurăm un cititor de comenzi din consolă
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    readline.on('line', async (input) => {
        if (input.trim().toLowerCase() === 'senddemo') {
            console.log('Simulăm trimiterea unui mesaj text...');
            try {
                await client.sendTextMessage('40712345678@s.whatsapp.net', 'Acesta este un mesaj demo trimis din Termux!');
                console.log('Demo: Mesaj trimis cu succes (simulare)');
            } catch (error) {
                console.error('Eroare la simularea trimiterii (așteptat în modul demo):', error.message);
            }
        }
        else if (input.trim().toLowerCase() === 'exit') {
            console.log('Se închide aplicația...');
            process.exit(0);
        }
        else {
            console.log('Comandă disponibilă: sendDemo (pentru a simula trimiterea unui mesaj)');
            console.log('                     exit (pentru a închide aplicația)');
        }
    });
}

// Pornește botul
startBot();

console.log('==============================================');
console.log('BOT WHATSAPP PENTRU TERMUX - MOD DEMONSTRAȚIE');
console.log('==============================================');
console.log('Acest exemplu rulează în modul de rezervă, special pentru Termux.');
console.log('Conexiunile la WhatsApp Web real nu sunt posibile în Termux');
console.log('din cauza limitărilor Puppeteer pe Android.');
console.log('==============================================');