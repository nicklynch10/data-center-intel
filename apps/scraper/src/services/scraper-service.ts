import { validateEnv } from '@dci/db';
import { GenericCountyScraper } from '../scrapers/generic-scraper.js';
import { ClaudeParser } from '../parsers/claude-parser.js';
import { DatabaseService } from './database.js';
import { uploadToS3 } from '../utils/s3.js';
import { logger } from '../utils/logger.js';
import { getCountyConfig } from '../scrapers/county-configs.js';
import type { ScrapedDocument } from '../types/index.js';

export class ScraperService {
  private db: DatabaseService;
  private parser: ClaudeParser;
  private s3Bucket: string;

  constructor() {
    const env = validateEnv();
    this.db = new DatabaseService();
    this.parser = new ClaudeParser(env.CLAUDE_API_KEY);
    this.s3Bucket = process.env.S3_BUCKET || 'data-center-intel-documents-prod';
  }

  async scrapeCounty(county: string, state: string, taskId?: string): Promise<void> {
    const startTime = Date.now();
    let scraper: GenericCountyScraper | null = null;

    try {
      // Update task status if provided
      if (taskId) {
        await this.db.updateScrapeTask(taskId, 'running', 'Starting scrape...');
      }

      // Get county configuration
      const countyKey = `${county.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`;
      const config = getCountyConfig(countyKey);
      
      if (!config) {
        throw new Error(`No configuration found for ${county}, ${state}`);
      }

      logger.info({ county, state, config: config.name }, 'Starting county scrape');

      // Find or create location
      const locationId = await this.db.findOrCreateLocation(county, state);

      // Initialize scraper
      scraper = new GenericCountyScraper(config);
      await scraper.initialize();

      // Scrape documents
      const documents = await scraper.scrape(county, state);
      logger.info({ count: documents.length }, 'Documents scraped');

      if (documents.length === 0) {
        logger.warn({ county, state }, 'No documents found');
        if (taskId) {
          await this.db.updateScrapeTask(taskId, 'success', 'No documents found');
        }
        return;
      }

      // Upload documents to S3
      const s3Paths = await this.uploadDocuments(documents, county, state);

      // Parse documents with Claude
      const parsedDataCenters = await this.parser.parseDocuments(documents);
      logger.info({ count: parsedDataCenters.length }, 'Data centers identified');

      // Save to database
      for (const dataCenter of parsedDataCenters) {
        const dataCenterId = await this.db.saveDataCenter(locationId, dataCenter);
        
        // Save associated documents
        const associatedDocs = documents.filter(doc => 
          dataCenter.sourceDocuments.includes(doc.url)
        );
        await this.db.saveDocuments(dataCenterId, associatedDocs, s3Paths);
      }

      const duration = Date.now() - startTime;
      const successLog = `Completed: ${documents.length} documents, ${parsedDataCenters.length} data centers found (${duration}ms)`;
      
      if (taskId) {
        await this.db.updateScrapeTask(taskId, 'success', successLog);
      }

      logger.info({ county, state, duration }, successLog);

    } catch (error) {
      logger.error({ error, county, state }, 'Scrape failed');
      
      if (taskId) {
        await this.db.updateScrapeTask(
          taskId, 
          'error', 
          `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      
      throw error;
    } finally {
      // Clean up
      if (scraper) {
        await scraper.cleanup();
      }
    }
  }

  private async uploadDocuments(
    documents: ScrapedDocument[], 
    county: string, 
    state: string
  ): Promise<Map<string, string>> {
    const s3Paths = new Map<string, string>();
    const timestamp = new Date().toISOString().split('T')[0];

    for (const doc of documents) {
      try {
        const urlHash = Buffer.from(doc.url).toString('base64').replace(/[/+=]/g, '').substring(0, 8);
        const key = `raw-documents/${state}/${county}/${timestamp}/${doc.docType}_${urlHash}.html`;
        
        const s3Path = await uploadToS3(
          this.s3Bucket,
          key,
          doc.rawContent,
          doc.metadata?.contentType || 'text/html'
        );

        s3Paths.set(doc.url, s3Path);
      } catch (error) {
        logger.error({ error, url: doc.url }, 'Failed to upload document');
      }
    }

    return s3Paths;
  }
}