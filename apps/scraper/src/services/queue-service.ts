import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

const ScrapeTaskMessageSchema = z.object({
  taskId: z.string(),
  locationId: z.string(),
  county: z.string(),
  state: z.string(),
  initiatedBy: z.string().optional(),
});

export type ScrapeTaskMessage = z.infer<typeof ScrapeTaskMessageSchema>;

export class QueueService {
  private client: SQSClient;
  private queueUrl: string;

  constructor(queueUrl?: string) {
    this.client = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-2',
    });
    this.queueUrl = queueUrl || process.env.SQS_QUEUE_URL || '';
    
    if (!this.queueUrl) {
      throw new Error('SQS_QUEUE_URL not configured');
    }
  }

  async sendScrapeTask(task: ScrapeTaskMessage): Promise<void> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(task),
        MessageAttributes: {
          taskType: {
            DataType: 'String',
            StringValue: 'scrape',
          },
          county: {
            DataType: 'String',
            StringValue: `${task.county}, ${task.state}`,
          },
        },
      });

      const response = await this.client.send(command);
      logger.info({ messageId: response.MessageId, task }, 'Sent scrape task to queue');
    } catch (error) {
      logger.error({ error, task }, 'Failed to send message to SQS');
      throw error;
    }
  }

  async receiveScrapeTask(): Promise<{ message: ScrapeTaskMessage; receiptHandle: string } | null> {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20, // Long polling
        MessageAttributeNames: ['All'],
      });

      const response = await this.client.send(command);
      
      if (!response.Messages || response.Messages.length === 0) {
        return null;
      }

      const message = response.Messages[0];
      if (!message.Body || !message.ReceiptHandle) {
        logger.warn('Received message without body or receipt handle');
        return null;
      }

      const parsed = ScrapeTaskMessageSchema.safeParse(JSON.parse(message.Body));
      if (!parsed.success) {
        logger.error({ errors: parsed.error.errors }, 'Invalid message format');
        // Delete invalid message
        await this.deleteMessage(message.ReceiptHandle);
        return null;
      }

      return {
        message: parsed.data,
        receiptHandle: message.ReceiptHandle,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to receive message from SQS');
      throw error;
    }
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      });

      await this.client.send(command);
      logger.info('Deleted message from queue');
    } catch (error) {
      logger.error({ error }, 'Failed to delete message from SQS');
      throw error;
    }
  }
}