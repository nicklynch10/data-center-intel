#!/usr/bin/env node
import { validateEnv } from '@dci/db';
import { QueueService } from './services/queue-service.js';
import { ScraperService } from './services/scraper-service.js';
import { DatabaseService } from './services/database.js';
import { logger } from './utils/logger.js';

// Validate environment
validateEnv();

export class ScrapeWorker {
  private queue: QueueService;
  private scraper: ScraperService;
  private db: DatabaseService;
  private isRunning: boolean = false;

  constructor() {
    this.queue = new QueueService();
    this.scraper = new ScraperService();
    this.db = new DatabaseService();
  }

  async start(): Promise<void> {
    this.isRunning = true;
    logger.info('Scrape worker started');

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());

    while (this.isRunning) {
      try {
        const task = await this.queue.receiveScrapeTask();
        
        if (!task) {
          logger.debug('No tasks in queue, waiting...');
          continue;
        }

        logger.info({ task: task.message }, 'Processing scrape task');

        // Update task status to running
        await this.db.updateScrapeTask(task.message.taskId, 'running');

        // Execute the scrape
        await this.scraper.scrapeCounty(
          task.message.county,
          task.message.state,
          task.message.taskId
        );

        // Delete message from queue
        await this.queue.deleteMessage(task.receiptHandle);
        
        logger.info({ taskId: task.message.taskId }, 'Task completed successfully');

      } catch (error) {
        logger.error({ error }, 'Worker error');
        // Continue processing other tasks
      }
    }
  }

  stop(): void {
    logger.info('Stopping scrape worker...');
    this.isRunning = false;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new ScrapeWorker();
  worker.start().catch(error => {
    logger.fatal({ error }, 'Worker failed to start');
    process.exit(1);
  });
}