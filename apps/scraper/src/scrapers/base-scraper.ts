import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../utils/logger.js';
import type { ScrapedDocument } from '../types/index.js';

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;

  async initialize(): Promise<void> {
    logger.info('Initializing browser...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });
    this.page = await this.browser.newPage();
    
    // Set a reasonable viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Set user agent to avoid detection
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    logger.info('Browser closed');
  }

  protected async waitAndClick(selector: string, timeout: number = 5000): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.waitForSelector(selector, { timeout });
    await this.page.click(selector);
  }

  protected async waitAndType(selector: string, text: string, timeout: number = 5000): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.waitForSelector(selector, { timeout });
    await this.page.type(selector, text);
  }

  protected async extractText(selector: string): Promise<string | null> {
    if (!this.page) throw new Error('Page not initialized');
    
    try {
      return await this.page.$eval(selector, el => el.textContent?.trim() || null);
    } catch {
      return null;
    }
  }

  protected async extractLinks(selector: string): Promise<string[]> {
    if (!this.page) throw new Error('Page not initialized');
    
    try {
      return await this.page.$$eval(selector, links => 
        links.map(link => (link as HTMLAnchorElement).href).filter(Boolean)
      );
    } catch {
      return [];
    }
  }

  protected async downloadPdf(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  abstract scrape(county: string, state: string): Promise<ScrapedDocument[]>;
}