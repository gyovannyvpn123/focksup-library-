/**
 * Modul pentru autentificare WhatsApp Web folosind Puppeteer
 * Acest modul permite emularea unui browser real pentru a evita restricțiile WhatsApp Web
 */

import { AuthenticationCredentials } from './Types';
import { createLogger } from './Utils';
import puppeteer, { Browser, Page } from 'puppeteer';

export class PuppeteerAuth {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private logger: ReturnType<typeof createLogger>;
    
    constructor(logLevel: string = 'info') {
        this.logger = createLogger('PuppeteerAuth', logLevel);
    }
    
    /**
     * Inițializează browserul Puppeteer
     */
    async initialize(): Promise<void> {
        try {
            this.logger.info('Inițializare browser Puppeteer...');
            
            // Încercăm să folosim Puppeteer în mod mai robust
            // folosind mai multe opțiuni care pot ajuta în medii restrictive
            const puppeteerOptions = {
                headless: true,
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--disable-features=site-per-process',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins',
                    '--disable-site-isolation-trials',
                    '--single-process',
                    '--no-zygote'
                ],
                ignoreDefaultArgs: ['--enable-automation'],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
            };
            
            this.logger.info('Lansare browser cu configurație robustă...');
            this.browser = await puppeteer.launch(puppeteerOptions);
            
            this.page = await this.browser.newPage();
            
            // Configurarea suplimentară a paginii pentru a părea mai mult ca un browser normal
            await this.page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );
            
            // Setăm viewport pentru a simula un ecran normal
            await this.page.setViewport({
                width: 1280,
                height: 800
            });
            
            // Setăm permisiuni pentru diferite funcționalități browser
            const context = this.browser.defaultBrowserContext();
            await context.overridePermissions('https://web.whatsapp.com', [
                'geolocation',
                'notifications',
                'camera',
                'microphone',
                'clipboard-read',
                'clipboard-write'
            ]);
            
            this.logger.info('Browser Puppeteer inițializat cu succes');
        } catch (error) {
            this.logger.error('Eroare la inițializarea browserului Puppeteer:', error);
            await this.cleanup();
            throw error;
        }
    }
    
    /**
     * Obține un cod QR pentru autentificare
     */
    async getQRCode(): Promise<{ qrData: string, credentials: AuthenticationCredentials }> {
        if (!this.page) {
            throw new Error('Pagina Puppeteer nu este inițializată');
        }
        
        try {
            this.logger.info('Navigare spre WhatsApp Web...');
            await this.page.goto('https://web.whatsapp.com/', { 
                waitUntil: 'networkidle2', 
                timeout: 60000 
            });
            
            this.logger.info('Așteptare pentru apariția codului QR...');
            await this.page.waitForSelector('div[data-testid="qrcode"]', { 
                timeout: 60000 
            });
            
            // Extragem datele codului QR
            const qrCodeData = await this.page.evaluate(() => {
                const qrCodeElement = document.querySelector('div[data-testid="qrcode"]');
                if (!qrCodeElement) return null;
                
                // Obținem datele codului QR din atributul data-ref
                return qrCodeElement.getAttribute('data-ref');
            });
            
            if (!qrCodeData) {
                throw new Error('Nu am putut obține datele codului QR');
            }
            
            this.logger.info('Cod QR obținut cu succes');
            
            // Creăm credențialele care vor fi actualizate după autentificare
            const partialCredentials: AuthenticationCredentials = {
                qrCode: qrCodeData,
                userAgent: await this.page.evaluate(() => navigator.userAgent)
            };
            
            return { qrData: qrCodeData, credentials: partialCredentials };
        } catch (error) {
            this.logger.error('Eroare la obținerea codului QR:', error);
            throw error;
        }
    }
    
    /**
     * Așteaptă autentificarea și obține credențialele
     */
    async waitForAuthentication(timeout = 120000): Promise<AuthenticationCredentials> {
        if (!this.page) {
            throw new Error('Pagina Puppeteer nu este inițializată');
        }
        
        try {
            this.logger.info('Așteptare pentru scanarea codului QR...');
            
            // Așteptăm ca elementul QR să dispară (indicând scanarea cu succes)
            await this.page.waitForSelector('div[data-testid="qrcode"]', { 
                hidden: true, 
                timeout 
            });
            
            this.logger.info('Cod QR scanat, autentificare în curs...');
            
            // Așteptăm încărcarea listei de conversații pentru a confirma autentificarea
            await this.page.waitForSelector('div[data-testid="chat-list"]', { 
                timeout: 60000 
            });
            
            this.logger.info('Autentificare reușită, colectare credențiale...');
            
            // Obținem cookie-urile și datele de sesiune
            const cookies = await this.page.cookies();
            
            // Obținem datele din localStorage
            const localStorage = await this.page.evaluate(() => {
                let storage: {[key: string]: string} = {};
                
                for (let i = 0; i < window.localStorage.length; i++) {
                    const key = window.localStorage.key(i);
                    if (key) {
                        storage[key] = window.localStorage.getItem(key) || '';
                    }
                }
                return storage;
            });
            
            // Creăm obiectul de credențiale pentru Focksup
            const credentials: AuthenticationCredentials = {
                cookies,
                localStorage,
                userAgent: await this.page.evaluate(() => navigator.userAgent)
            };
            
            this.logger.info('Credențiale colectate cu succes');
            
            return credentials;
        } catch (error) {
            this.logger.error('Eroare la așteptarea autentificării:', error);
            throw error;
        } finally {
            // Curățăm resources indiferent de rezultat
            await this.cleanup();
        }
    }
    
    /**
     * Curăță resursele browser-ului
     */
    async cleanup(): Promise<void> {
        try {
            if (this.page) {
                await this.page.close();
                this.page = null;
            }
            
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
            
            this.logger.info('Resurse browser curățate');
        } catch (error) {
            this.logger.error('Eroare la curățarea resurselor:', error);
        }
    }
}

export default PuppeteerAuth;