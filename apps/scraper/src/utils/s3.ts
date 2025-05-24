import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger } from './logger.js';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
});

export async function uploadToS3(
  bucket: string,
  key: string,
  content: Buffer | string,
  contentType: string = 'text/html'
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: contentType,
    });

    await s3Client.send(command);
    logger.info({ bucket, key }, 'Uploaded to S3');
    
    return `s3://${bucket}/${key}`;
  } catch (error) {
    logger.error({ error, bucket, key }, 'Failed to upload to S3');
    throw error;
  }
}