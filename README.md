# Focksup Library

O bibliotecă puternică Node.js pentru interacțiunea cu WhatsApp Web, care susține autentificarea prin cod QR și cod de asociere.

## Caracteristici

- 📱 Conectare la WhatsApp Web
- 🔐 Autentificare folosind cod QR, cod de asociere sau Puppeteer (browser emulat)
- 💬 Trimitere și primire mesaje text
- 📷 Trimitere și primire media (imagini, videoclipuri, documente etc.)
- 👥 Creare și gestionare grupuri
- 🔄 Gestionare mesaje bazată pe evenimente
- 👀 Actualizări de stare (online, tastare etc.)
- 💾 Gestionare sesiune pentru reconectare
- 🌐 Autentificare cu Puppeteer pentru a evita restricțiile WhatsApp

## Instalare

```bash
npm install focksup-library
```

## Dependențe sistem (pentru Puppeteer)

Pentru a folosi autentificarea cu Puppeteer (recomandată), asigurați-vă că aveți instalate următoarele dependențe:

```bash
# Pentru Debian/Ubuntu
apt-get install -y chromium glib gtk3 nss nspr dbus libatk1.0-0 libx11-xcb1

# Pentru Arch Linux
pacman -S chromium glib gtk3 nss dbus 

# Pentru Fedora
dnf install chromium glib gtk3 nss nspr dbus
```

> **Notă**: Dacă aceste dependențe nu pot fi instalate, biblioteca va folosi o metodă de autentificare de rezervă. Aceasta este doar pentru **demonstrație** și **nu va funcționa** cu serverele WhatsApp reale, dar permite dezvoltatorilor să testeze API-ul bibliotecii.

## Utilizare simplă

### Autentificare cu Puppeteer (Recomandat)

```javascript
const { FocksupClient } = require('focksup-library');

// Creează un nou client
const client = new FocksupClient({
    logLevel: 'info'
});

// Tratează evenimentele
client.on('qr', (qrCode) => {
    console.log('Scanează acest cod QR cu WhatsApp de pe telefonul tău:');
    // Codul QR este afișat automat în terminal
});

client.on('ready', () => {
    console.log('Client este pregătit!');
    
    // Trimite un mesaj după conectare
    client.sendTextMessage('40712345678@s.whatsapp.net', 'Salut din Focksup Library!')
        .then(msg => console.log('Mesaj trimis cu succes!'))
        .catch(err => console.error('Eroare la trimiterea mesajului:', err));
});

client.on('message', (message) => {
    console.log('Mesaj primit:', message);
    
    // Răspunde automat la mesaje
    if (!message.fromMe) {
        client.sendTextMessage(message.from, 'Am primit mesajul tău: ' + message.body)
            .catch(err => console.error('Eroare la trimiterea răspunsului:', err));
    }
});

// Conectare cu Puppeteer pentru a evita restricțiile WhatsApp Web
async function startClient() {
    try {
        await client.authenticateWithPuppeteer();
    } catch (error) {
        console.error('Eroare la pornirea clientului:', error);
    }
}

startClient();
```

## Funcționalități avansate

### Gestionarea grupurilor

```javascript
// Crearea unui grup nou
const result = await client.createGroup('Numele Grupului', ['4072xxxxxxx@s.whatsapp.net', '4073xxxxxxx@s.whatsapp.net']);
console.log('Grup creat:', result.id);

// Adăugarea participanților la un grup
const addResult = await client.addGroupParticipants(
    'grupId@g.us', 
    ['4074xxxxxxx@s.whatsapp.net']
);
console.log('Participanți adăugați:', addResult.added);

// Eliminarea participanților dintr-un grup
const removeResult = await client.removeGroupParticipants(
    'grupId@g.us', 
    ['4074xxxxxxx@s.whatsapp.net']
);
console.log('Participanți eliminați:', removeResult.removed);
```

### Tratarea mesajelor

```javascript
// Ascultarea pentru mesaje noi
client.on('message', async (message) => {
    console.log(`Mesaj nou de la ${message.from}: ${message.body}`);
    
    // Răspunde la comenzi specifice
    if (message.body.startsWith('!help')) {
        await client.sendTextMessage(message.from, 'Comenzi disponibile: !help, !info, !time');
    } 
    else if (message.body.startsWith('!time')) {
        const now = new Date().toLocaleString();
        await client.sendTextMessage(message.from, `Data și ora curentă: ${now}`);
    }
    else if (message.body.startsWith('!info')) {
        await client.sendTextMessage(message.from, 'Acest bot este creat cu Focksup Library');
    }
});
```

## Documentație API

### Clasa `FocksupClient`

Clasa principală pentru interacțiunea cu WhatsApp.

#### Constructor

```javascript
const client = new FocksupClient(options);
```

**Opțiuni:**
- `logLevel`: Nivelul de logare ('error', 'warn', 'info', 'debug'), default: 'info'
- `maxReconnectAttempts`: Numărul maxim de încercări de reconectare, default: 5
- `reconnectInterval`: Intervalul de reconectare în ms, default: 3000
- `restartOnConnectionLost`: Dacă se va încerca reconectarea, default: true

#### Metode principale

- `connect(credentials)`: Conectare la WhatsApp Web, opțional cu credențiale pentru reconectare
- `authenticateWithQR()`: Autentificare folosind cod QR (necesită scanare)
- `authenticateWithPairingCode()`: Autentificare folosind cod de asociere
- `authenticateWithPuppeteer()`: Autentificare folosind Puppeteer (recomandat)
- `disconnect()`: Deconectare de la WhatsApp Web
- `getState()`: Obține starea conexiunii ('disconnected', 'connecting', 'authenticating', 'connected')
- `getCredentials()`: Obține credențialele pentru reconectare

#### Metode de trimitere mesaje

- `sendTextMessage(to, text)`: Trimite un mesaj text
- `sendImageMessage(to, image, caption)`: Trimite o imagine (Buffer sau URL)
- `sendDocument(to, document, filename, caption)`: Trimite un document (Buffer sau URL)

#### Evenimente

- `'connecting'`: Emis când începe conectarea
- `'qr'`: Emis cu codul QR pentru scanare
- `'pairing_code'`: Emis cu codul de asociere pentru dispozitiv
- `'authenticated'`: Emis când autentificarea s-a realizat cu succes
- `'ready'`: Emis când clientul este pregătit de folosire
- `'message'`: Emis când se primește un mesaj
- `'message_create'`: Emis când se creează un mesaj
- `'message_revoke'`: Emis când un mesaj este șters
- `'disconnected'`: Emis când clientul este deconectat
- `'reconnecting'`: Emis când clientul încearcă să se reconecteze
- `'reconnected'`: Emis când clientul s-a reconectat cu succes

### Autentificare cu Puppeteer și Stocare Sesiune

```javascript
const { FocksupClient } = require('focksup-library');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');

// Calea fișierului de sesiune pentru stocarea credențialelor
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

// Creează un nou client
const client = new FocksupClient({
    logLevel: 'info'
});

// Setează evenimentele
client.on('qr', (qrCode) => {
    console.log('Scanează acest cod QR cu WhatsApp de pe telefonul tău:');
    qrcode.generate(qrCode, { small: true });
});

client.on('authenticated', () => {
    console.log('Autentificat cu succes!');
    
    // Salvează sesiunea pentru utilizare ulterioară
    const credentials = client.getCredentials();
    if (credentials) {
        saveSession(credentials);
    }
});

client.on('ready', () => {
    console.log('Client pregătit!');
    // Acum poți trimite mesaje, etc.
});

// Pornire client
async function startClient() {
    try {
        // Verifică dacă avem o sesiune salvată
        const savedSession = loadSession();
        if (savedSession) {
            // Încearcă reconectarea cu sesiunea salvată
            await client.connect(savedSession);
        } else {
            // Autentificare nouă cu Puppeteer
            await client.authenticateWithPuppeteer();
        }
    } catch (error) {
        console.error('Eroare la pornirea clientului:', error);
    }
}

startClient();
