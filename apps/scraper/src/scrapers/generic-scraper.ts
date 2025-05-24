import { BaseScraper } from './base-scraper.js';
import { logger } from '../utils/logger.js';
import type { ScrapedDocument, CountySource } from '../types/index.js';

export class GenericCountyScraper extends BaseScraper {
  constructor(private source: CountySource) {
    super();
  }

  async scrape(county: string, state: string): Promise<ScrapedDocument[]> {
    if (!this.page) {
      await this.initialize();
    }

    const documents: ScrapedDocument[] = [];

    try {
      logger.info({ county, state, url: this.source.baseUrl }, 'Starting scrape');
      
      // Navigate to the county website
      await this.page!.goto(this.source.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Search for each term
      for (const searchTerm of this.source.searchTerms) {
        logger.info({ searchTerm }, 'Searching for term');
        
        try {
          // Find and use search functionality if available
          if (this.source.searchEndpoint) {
            await this.page!.goto(`${this.source.baseUrl}${this.source.searchEndpoint}?q=${encodeURIComponent(searchTerm)}`, {
              waitUntil: 'networkidle2',
              timeout: 30000,
            });
          } else {
            // Look for a search box on the page
            const searchSelectors = [
              'input[type="search"]',
              'input[name*="search"]',
              'input[id*="search"]',
              'input[placeholder*="search" i]',
            ];

            let searchFound = false;
            for (const selector of searchSelectors) {
              try {
                await this.page!.waitForSelector(selector, { timeout: 2000 });
                await this.page!.type(selector, searchTerm);
                await this.page!.keyboard.press('Enter');
                await this.page!.waitForNavigation({ waitUntil: 'networkidle2' });
                searchFound = true;
                break;
              } catch {
                continue;
              }
            }

            if (!searchFound) {
              logger.warn({ searchTerm }, 'No search box found, skipping term');
              continue;
            }
          }

          // Extract document links
          const links = await this.extractLinks(this.source.documentSelector);
          logger.info({ count: links.length }, 'Found document links');

          // Process each link
          for (const link of links.slice(0, 10)) { // Limit to 10 documents per search
            try {
              const isPdf = link.toLowerCase().endsWith('.pdf');
              
              if (isPdf) {
                const pdfBuffer = await this.downloadPdf(link);
                documents.push({
                  url: link,
                  docType: 'permit',
                  rawContent: `PDF_BINARY_SIZE:${pdfBuffer.length}`,
                  scrapedAt: new Date(),
                  metadata: {
                    contentType: 'application/pdf',
                    size: pdfBuffer.length,
                    county,
                    state,
                    searchTerm,
                  },
                });
              } else {
                // Navigate to the document page
                await this.page!.goto(link, {
                  waitUntil: 'networkidle2',
                  timeout: 30000,
                });

                const content = await this.page!.content();
                const title = await this.extractText('title') || 'Untitled';

                documents.push({
                  url: link,
                  docType: this.classifyDocument(title, content),
                  rawContent: content,
                  scrapedAt: new Date(),
                  metadata: {
                    title,
                    contentType: 'text/html',
                    county,
                    state,
                    searchTerm,
                  },
                });
              }

              logger.info({ url: link }, 'Scraped document');
            } catch (error) {
              logger.error({ error, url: link }, 'Failed to scrape document');
            }
          }
        } catch (error) {
          logger.error({ error, searchTerm }, 'Search failed');
        }
      }

      return documents;
    } catch (error) {
      logger.error({ error, county, state }, 'Scrape failed');
      throw error;
    }
  }

  private classifyDocument(title: string, content: string): ScrapedDocument['docType'] {
    const lower = (title + ' ' + content).toLowerCase();
    
    if (lower.includes('permit') || lower.includes('building')) {
      return 'permit';
    } else if (lower.includes('zoning') || lower.includes('minutes')) {
      return 'zoning_minutes';
    } else if (lower.includes('utility') || lower.includes('power')) {
      return 'utility_filing';
    } else if (lower.includes('planning') || lower.includes('development')) {
      return 'planning_doc';
    }
    
    return 'other';
  }
}