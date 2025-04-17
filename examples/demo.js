/**
 * Exemplu pentru demonstrații cu metoda de rezervă 
 * Acest exemplu va funcționa chiar și fără dependențele Puppeteer instalate
 */

const { FocksupClient } = require('../dist/src');
const qrcode = require('qrcode-terminal');
const readline = require('readline');

// Creează interfața readline pentru input utilizator
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Funcție pentru a pune întrebări utilizatorului
const question = (query) => {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
};

// Creează un nou client Focksup
const client = new FocksupClient({
    logLevel: 'info'
});

// Setarea evenimentelor pentru client
client.on('qr', (qrCode) => {
    console.log('Scanează acest cod QR (demo):');
    qrcode.generate(qrCode, { small: true });
    console.log('\nNotă: Acesta este un cod QR de demo. În modul real, ar trebui scanat cu aplicația WhatsApp.');
    console.log('Din cauza lipsei dependențelor Puppeteer, acest demo folosește metoda de rezervă.');
});

client.on('ready', async () => {
    console.log('\n========================================');
    console.log('Clientul este pregătit! (Mod demonstrație)');
    console.log('========================================\n');
    
    await showMenu();
});

client.on('authenticated', () => {
    console.log('Autentificat cu succes! (Mod demonstrație)');
});

client.on('message', (message) => {
    if (!message.fromMe) {
        console.log('\n---------------------------------------');
        console.log(`[DEMO] Mesaj primit de la: ${message.from}`);
        console.log(`Conținut: ${message.body}`);
        console.log('---------------------------------------');
        
        // Răspunde automat
        setTimeout(() => {
            console.log(`[DEMO] Trimit răspuns la: ${message.from}`);
        }, 500);
    }
});

client.on('disconnected', (reason) => {
    console.log('Clientul a fost deconectat:', reason);
});

// Funcție pentru a trimite mesaj text
const sendTextMessage = async () => {
    try {
        const recipient = await question('Introdu numărul de telefon al destinatarului (ex: 07xxxxxxxx): ');
        const message = await question('Introdu mesajul: ');
        
        // Formatează numărul pentru WhatsApp
        let formattedRecipient = recipient;
        if (!recipient.includes('@')) {
            // Elimină orice caracter non-numeric
            let cleaned = recipient.replace(/\D/g, '');
            
            // Adaugă prefixul '4' dacă începe cu '0'
            if (cleaned.startsWith('0')) {
                cleaned = '4' + cleaned;
            }
            
            formattedRecipient = `${cleaned}@s.whatsapp.net`;
        }
        
        console.log(`[DEMO] Trimit mesaj către ${formattedRecipient}...`);
        console.log('Reține că acest mesaj nu este trimis real, deoarece folosim metoda de rezervă.');
        
        await client.sendTextMessage(formattedRecipient, message);
        console.log('[DEMO] Mesaj trimis cu succes! (simulare)');
    } catch (error) {
        console.error('Eroare la trimiterea mesajului:', error);
    }
    
    return showMenu();
};

// Funcție pentru a trimite o imagine
const sendImageMessage = async () => {
    try {
        const recipient = await question('Introdu numărul de telefon al destinatarului (ex: 07xxxxxxxx): ');
        const imageUrl = await question('Introdu URL-ul imaginii: ');
        const caption = await question('Introdu descrierea (opțional): ');
        
        // Formatează numărul pentru WhatsApp
        let formattedRecipient = recipient;
        if (!recipient.includes('@')) {
            // Elimină orice caracter non-numeric
            let cleaned = recipient.replace(/\D/g, '');
            
            // Adaugă prefixul '4' dacă începe cu '0'
            if (cleaned.startsWith('0')) {
                cleaned = '4' + cleaned;
            }
            
            formattedRecipient = `${cleaned}@s.whatsapp.net`;
        }
        
        console.log(`[DEMO] Trimit imagine către ${formattedRecipient}...`);
        console.log('Reține că această imagine nu este trimisă real, deoarece folosim metoda de rezervă.');
        
        await client.sendImageMessage(formattedRecipient, imageUrl, caption || undefined);
        console.log('[DEMO] Imagine trimisă cu succes! (simulare)');
    } catch (error) {
        console.error('Eroare la trimiterea imaginii:', error);
    }
    
    return showMenu();
};

// Funcție pentru a simula primirea unui mesaj
const simulateIncomingMessage = async () => {
    try {
        const sender = await question('Introdu numărul de telefon al expeditorului (ex: 07xxxxxxxx): ');
        const message = await question('Introdu mesajul primit: ');
        
        // Formatează numărul pentru WhatsApp
        let formattedSender = sender;
        if (!sender.includes('@')) {
            // Elimină orice caracter non-numeric
            let cleaned = sender.replace(/\D/g, '');
            
            // Adaugă prefixul '4' dacă începe cu '0'
            if (cleaned.startsWith('0')) {
                cleaned = '4' + cleaned;
            }
            
            formattedSender = `${cleaned}@s.whatsapp.net`;
        }
        
        console.log(`[DEMO] Simulez primirea unui mesaj de la ${formattedSender}...`);
        
        // Creăm un obiect mesaj demo și emitem evenimentul
        const demoMessage = {
            id: 'demo_' + Date.now(),
            from: formattedSender,
            to: 'me@s.whatsapp.net',
            fromMe: false,
            timestamp: Date.now() / 1000,
            type: 'text',
            body: message
        };
        
        // Emitem evenimentul message pentru a declanșa handler-ul
        client.emit('message', demoMessage);
    } catch (error) {
        console.error('Eroare la simularea mesajului:', error);
    }
    
    return showMenu();
};

// Meniu principal
const showMenu = async () => {
    console.log('\n===== DEMO FOCKSUP LIBRARY =====');
    console.log('1. Trimite mesaj text (simulare)');
    console.log('2. Trimite imagine (simulare)');
    console.log('3. Simulează primirea unui mesaj');
    console.log('4. Ieșire');
    console.log('===============================\n');
    
    const choice = await question('Alege o opțiune (1-4): ');
    
    switch (choice) {
        case '1':
            await sendTextMessage();
            break;
        case '2':
            await sendImageMessage();
            break;
        case '3':
            await simulateIncomingMessage();
            break;
        case '4':
            console.log('Se închide aplicația...');
            rl.close();
            await client.disconnect();
            process.exit(0);
            break;
        default:
            console.log('Opțiune invalidă, încearcă din nou.');
            await showMenu();
            break;
    }
};

// Funcția principală - folosește autentificarea Puppeteer (care va folosi metoda de rezervă)
async function startClient() {
    try {
        console.log('Inițiez autentificarea cu Puppeteer (sau metoda de rezervă dacă nu este disponibil)...');
        await client.authenticateWithPuppeteer();
    } catch (error) {
        console.error('Eroare la startClient:', error);
        process.exit(1);
    }
}

// Inițiem procesul de autentificare și pornire a clientului
startClient();

// Gestionăm închiderea aplicației
process.on('SIGINT', async () => {
    console.log('Se închide aplicația...');
    rl.close();
    await client.disconnect();
    process.exit(0);
});