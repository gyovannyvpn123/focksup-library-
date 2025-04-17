/**
 * Demo complet pentru conectare cu cod de asociere și trimitere mesaje
 * cu biblioteca Focksup
 */

const { FocksupClient } = require('../dist/src');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const qrcode = require('qrcode-terminal');

// Creează o interfață readline pentru input utilizator
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

// Calea fișierului de sesiune pentru stocarea credențialelor
const SESSION_FILE_PATH = path.join(__dirname, 'message-demo-session.json');

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

// Creează un nou client Focksup
const client = new FocksupClient({
    logLevel: 'info'
});

// Funcție pentru a trimite mesaj text
const sendTextMessage = async () => {
    try {
        const recipient = await question('Introdu numărul de telefon al destinatarului (ex: 07xxxxxxxx sau grupul ID): ');
        const message = await question('Introdu mesajul: ');
        
        // Formatează numărul pentru WhatsApp
        let formattedRecipient = recipient;
        if (!recipient.includes('@')) {
            // Elimină orice caracter non-numeric
            let cleaned = recipient.replace(/\D/g, '');
            
            // Adaugă prefixul '4' dacă începe cu '0' (pentru România)
            if (cleaned.startsWith('0')) {
                cleaned = '4' + cleaned;
            }
            
            formattedRecipient = `${cleaned}@s.whatsapp.net`;
        }
        
        console.log(`Se trimite mesaj către ${formattedRecipient}...`);
        
        await client.sendTextMessage(formattedRecipient, message);
        console.log('Mesaj trimis cu succes!');
    } catch (error) {
        console.error('Eroare la trimiterea mesajului:', error);
    }
    
    return showMenu();
};

// Funcție pentru a trimite o imagine
const sendImageMessage = async () => {
    try {
        const recipient = await question('Introdu numărul de telefon al destinatarului (ex: 07xxxxxxxx sau grupul ID): ');
        const imageUrl = await question('Introdu URL-ul imaginii: ');
        const caption = await question('Introdu descrierea imaginii (opțional): ');
        
        // Formatează numărul pentru WhatsApp
        let formattedRecipient = recipient;
        if (!recipient.includes('@')) {
            // Elimină orice caracter non-numeric
            let cleaned = recipient.replace(/\D/g, '');
            
            // Adaugă prefixul '4' dacă începe cu '0' (pentru România)
            if (cleaned.startsWith('0')) {
                cleaned = '4' + cleaned;
            }
            
            formattedRecipient = `${cleaned}@s.whatsapp.net`;
        }
        
        console.log(`Se trimite imagine către ${formattedRecipient}...`);
        
        await client.sendImageMessage(formattedRecipient, imageUrl, caption || undefined);
        console.log('Imagine trimisă cu succes!');
    } catch (error) {
        console.error('Eroare la trimiterea imaginii:', error);
    }
    
    return showMenu();
};

// Funcție pentru a trimite un document
const sendDocumentMessage = async () => {
    try {
        const recipient = await question('Introdu numărul de telefon al destinatarului (ex: 07xxxxxxxx sau grupul ID): ');
        const documentUrl = await question('Introdu URL-ul documentului: ');
        const filename = await question('Introdu numele fișierului (cu extensie): ');
        const caption = await question('Introdu descrierea documentului (opțional): ');
        
        // Formatează numărul pentru WhatsApp
        let formattedRecipient = recipient;
        if (!recipient.includes('@')) {
            // Elimină orice caracter non-numeric
            let cleaned = recipient.replace(/\D/g, '');
            
            // Adaugă prefixul '4' dacă începe cu '0' (pentru România)
            if (cleaned.startsWith('0')) {
                cleaned = '4' + cleaned;
            }
            
            formattedRecipient = `${cleaned}@s.whatsapp.net`;
        }
        
        console.log(`Se trimite document către ${formattedRecipient}...`);
        
        await client.sendDocument(formattedRecipient, documentUrl, filename, caption || undefined);
        console.log('Document trimis cu succes!');
    } catch (error) {
        console.error('Eroare la trimiterea documentului:', error);
    }
    
    return showMenu();
};

// Meniu principal
const showMenu = async () => {
    console.log('\n===== DEMO FOCKSUP LIBRARY =====');
    console.log('1. Trimite mesaj text');
    console.log('2. Trimite imagine');
    console.log('3. Trimite document');
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

// Setarea evenimentelor pentru client
client.on('message', (message) => {
    if (!message.fromMe) {
        console.log('\n---------------------------------------');
        console.log(`Mesaj primit de la: ${message.from}`);
        console.log(`Conținut: ${message.body}`);
        console.log('---------------------------------------');
    }
});

client.on('ready', async () => {
    console.log('Client este pregătit!');
    await showMenu();
});

client.on('authenticated', () => {
    console.log('Autentificat cu succes!');
    
    // Salvează sesiunea pentru utilizare ulterioară
    const credentials = client.getCredentials();
    if (credentials) {
        saveSession(credentials);
    }
});

client.on('disconnected', (reason) => {
    console.log('Clientul a fost deconectat:', reason);
});

// Funcția principală - folosește Puppeteer pentru a emula un browser real
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
                console.log('Nu am putut folosi sesiunea salvată, încercăm autentificarea cu browser.');
                // Continuăm cu autentificarea prin browser
            }
        }

        console.log('Inițializez browser Puppeteer pentru autentificare...');
        
        // Lansează un browser Puppeteer
        const browser = await puppeteer.launch({
            headless: true, // Folosim modul headless
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            
            // Setăm user agent pentru a părea un browser normal
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Navigăm la WhatsApp Web
            console.log('Accesăm WhatsApp Web...');
            await page.goto('https://web.whatsapp.com/', { waitUntil: 'networkidle2', timeout: 60000 });
            
            // Așteptăm să apară codul QR
            console.log('Așteptăm codul QR...');
            await page.waitForSelector('div[data-testid="qrcode"]', { timeout: 60000 });
            
            // Extragem datele codului QR
            const qrCodeData = await page.evaluate(function() {
                const qrCodeElement = document.querySelector('div[data-testid="qrcode"]');
                if (!qrCodeElement) return null;
                
                // Obținem datele codului QR din atributul data-ref
                return qrCodeElement.getAttribute('data-ref');
            });
            
            if (!qrCodeData) {
                throw new Error('Nu am putut obține datele codului QR');
            }
            
            // Afișăm codul QR în terminal
            console.log('Scanează acest cod QR cu WhatsApp de pe telefonul tău:');
            qrcode.generate(qrCodeData, { small: true });
            
            // Așteptăm autentificarea
            console.log('Așteptăm autentificarea...');
            await page.waitForSelector('div[data-testid="qrcode"]', { hidden: true, timeout: 120000 });
            
            console.log('Cod QR scanat, autentificare în curs...');
            
            // Așteptăm încă puțin să se încarce complet sesiunea
            await page.waitForSelector('div[data-testid="chat-list"]', { timeout: 60000 });
            
            // Obținem cookie-urile și datele de sesiune
            const cookies = await page.cookies();
            const localStorage = await page.evaluate(function() {
                let storage = {};
                
                for (let i = 0; i < window.localStorage.length; i++) {
                    const key = window.localStorage.key(i);
                    if (key) {
                        storage[key] = window.localStorage.getItem(key) || '';
                    }
                }
                return storage;
            });
            
            // Creăm un obiect de sesiune pentru Focksup
            const sessionData = {
                cookies,
                localStorage,
                userAgent: await page.evaluate(function() { return navigator.userAgent; })
            };
            
            // Salvăm datele sesiunii
            saveSession(sessionData);
            
            // Conectăm clientul Focksup cu datele de sesiune
            console.log('Conectăm clientul Focksup cu datele de sesiune obținute...');
            await client.connect(sessionData);
            
            console.log('Autentificare reușită!');
        } finally {
            // Închidem browser-ul Puppeteer indiferent de rezultat
            await browser.close();
        }
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