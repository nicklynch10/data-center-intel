import { db, locationQueries, dataCenterQueries, documentQueries, scrapeTaskQueries } from '@dci/db';
import { logger } from '../utils/logger.js';
import type { ParsedDataCenter, ScrapedDocument } from '../types/index.js';

export class DatabaseService {
  async findOrCreateLocation(county: string, state: string): Promise<string> {
    // Check if location exists
    const existing = await locationQueries.findByCountyState(county, state);
    if (existing.length > 0) {
      return existing[0].id;
    }

    // Create new location
    const [newLocation] = await locationQueries.create({
      county,
      state,
    });

    logger.info({ county, state, id: newLocation.id }, 'Created new location');
    return newLocation.id;
  }

  async saveDataCenter(locationId: string, data: ParsedDataCenter): Promise<string> {
    const [dataCenter] = await dataCenterQueries.create({
      name: data.name,
      locationId,
      status: data.status,
      developer: data.developer,
      sqft: data.sqft?.toString(),
      powerMw: data.powerMw?.toString(),
      firstSeen: data.filingDate || new Date(),
      lastSeen: new Date(),
    });

    logger.info({ id: dataCenter.id, name: data.name }, 'Created data center');
    return dataCenter.id;
  }

  async saveDocuments(dataCenterId: string, documents: ScrapedDocument[], s3Paths: Map<string, string>): Promise<void> {
    for (const doc of documents) {
      try {
        // Check if document already exists
        const existing = await documentQueries.findBySourceUrl(doc.url);
        if (existing.length > 0) {
          logger.info({ url: doc.url }, 'Document already exists, skipping');
          continue;
        }

        await documentQueries.create({
          dataCenterId,
          sourceUrl: doc.url,
          docType: doc.docType,
          s3Path: s3Paths.get(doc.url),
          textContent: doc.rawContent.substring(0, 10000), // Store first 10k chars
          meta: doc.metadata,
        });

        logger.info({ url: doc.url, dataCenterId }, 'Saved document');
      } catch (error) {
        logger.error({ error, url: doc.url }, 'Failed to save document');
      }
    }
  }

  async createScrapeTask(locationId: string, initiatedBy?: string): Promise<string> {
    const [task] = await scrapeTaskQueries.create({
      locationId,
      initiatedBy,
      status: 'queued',
    });

    logger.info({ id: task.id, locationId }, 'Created scrape task');
    return task.id;
  }

  async updateScrapeTask(taskId: string, status: 'running' | 'success' | 'error', log?: string): Promise<void> {
    await scrapeTaskQueries.updateStatus(taskId, status, log);
    logger.info({ taskId, status }, 'Updated scrape task');
  }
}