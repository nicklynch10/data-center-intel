#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { validateEnv } from '@dci/db';
import { ScraperService } from './services/scraper-service.js';
import { listCounties } from './scrapers/county-configs.js';
import { logger } from './utils/logger.js';

// Validate environment on startup
try {
  validateEnv();
} catch (error) {
  console.error(chalk.red('Environment validation failed. Please check your .env.local file.'));
  process.exit(1);
}

const program = new Command();

program
  .name('dci-scraper')
  .description('Data Center Intel - Manual county scraper')
  .version('0.1.0');

program
  .command('scrape <county> <state>')
  .description('Scrape a specific county for data center information')
  .option('-t, --task-id <id>', 'Associated task ID for status updates')
  .action(async (county: string, state: string, options: { taskId?: string }) => {
    console.log(chalk.blue(`🔍 Scraping ${county}, ${state}...`));
    
    const scraper = new ScraperService();
    
    try {
      await scraper.scrapeCounty(county, state, options.taskId);
      console.log(chalk.green(`✅ Scrape completed successfully!`));
    } catch (error) {
      console.error(chalk.red(`❌ Scrape failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all configured counties')
  .action(() => {
    console.log(chalk.blue('📍 Configured counties:'));
    
    const counties = listCounties();
    counties.forEach(county => {
      const [name, state] = county.split('-');
      console.log(`  - ${chalk.yellow(name.charAt(0).toUpperCase() + name.slice(1))}, ${chalk.yellow(state.toUpperCase())}`);
    });
    
    console.log(chalk.gray(`\nTotal: ${counties.length} counties`));
  });

program
  .command('test-connection')
  .description('Test database and AWS connections')
  .action(async () => {
    console.log(chalk.blue('🔌 Testing connections...'));
    
    try {
      // Test database
      const { db } = await import('@dci/db');
      await db.select().from('SELECT 1 as test');
      console.log(chalk.green('✅ Database connection successful'));
      
      // Test AWS S3
      const { S3Client, ListBucketsCommand } = await import('@aws-sdk/client-s3');
      const s3 = new S3Client({ region: process.env.AWS_REGION });
      await s3.send(new ListBucketsCommand({}));
      console.log(chalk.green('✅ AWS S3 connection successful'));
      
      // Test Claude
      const env = validateEnv();
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10,
        }),
      });
      
      if (response.ok) {
        console.log(chalk.green('✅ Claude API connection successful'));
      } else {
        throw new Error(`Claude API returned ${response.status}`);
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s'), program.args.join(' '));
  console.log('See --help for a list of available commands.');
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}