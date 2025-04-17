/**
 * Implementare de rezervă pentru autentificare când Puppeteer nu este disponibil
 * Aceasta este o soluție alternativă pentru medii unde dependențele Puppeteer nu pot fi instalate
 */

import { AuthenticationCredentials } from './Types';
import { createLogger } from './Utils';
import * as qrcode from 'qrcode';

export class FallbackAuth {
    private logger: ReturnType<typeof createLogger>;
    
    constructor(logLevel: string = 'info') {
        this.logger = createLogger('FallbackAuth', logLevel);
    }
    
    /**
     * Simulează autentificarea prin generarea unui cod QR pentru scanare manuală
     * 
     * NOTĂ: Această metodă este doar o soluție de rezervă și nu va funcționa în mod real
     * deoarece WhatsApp Web blochează conexiunile directe non-browser.
     * 
     * Este util doar pentru testare sau pentru a permite utilizatorilor să vadă
     * cum ar funcționa biblioteca în condiții normale.
     */
    async authenticate(): Promise<{ qrData: string }> {
        this.logger.info('Folosesc metoda de autentificare alternativă (fără Puppeteer)');
        this.logger.warn('Această metodă nu va funcționa complet cu WhatsApp Web!');
        this.logger.warn('Este recomandat să instalați dependențele necesare pentru Puppeteer.');
        
        // Creăm un cod QR de exemplu (nu este unul real pentru WhatsApp)
        const demoData = 'whatsapp://example-fallback-qr-code-' + Date.now();
        
        // Generăm codul QR
        const qrImageUrl = await qrcode.toDataURL(demoData);
        
        this.logger.info('Cod QR demo generat. Acesta este doar pentru demonstrație!');
        
        return { qrData: demoData };
    }
    
    /**
     * Așteaptă completarea autentificării
     * Aceasta doar simulează așteptarea în implementarea de rezervă
     */
    async waitForAuthentication(): Promise<AuthenticationCredentials> {
        this.logger.info('Simulez așteptarea autentificării...');
        
        // Așteptăm câteva secunde pentru a simula scanarea
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        this.logger.warn('Autentificarea de rezervă nu oferă credențiale reale pentru WhatsApp!');
        
        // Returnăm credențiale fictive
        const demoCredentials: AuthenticationCredentials = {
            session: 'fallback-session-' + Date.now(),
            userAgent: 'Mozilla/5.0 FallbackAuth Demo'
        };
        
        return demoCredentials;
    }
}

export default FallbackAuth;