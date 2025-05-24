import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, locationQueries, dataCenterQueries, scrapeTaskQueries } from '@dci/db';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const LookupSchema = z.object({
  county: z.string().min(1).max(100),
  state: z.string().length(2).toUpperCase(),
});

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-2',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = LookupSchema.parse(body);

    // Normalize input
    const county = validated.county.trim();
    const state = validated.state.trim();

    // Check if location exists
    const locations = await locationQueries.findByCountyState(county, state);

    if (locations.length > 0) {
      // Location exists, fetch data centers
      const location = locations[0];
      const dataCenters = await dataCenterQueries.findByLocation(location.id);

      // Check if we need to refresh (last scrape > 30 days)
      const recentTasks = await scrapeTaskQueries.getRecentByLocation(location.id);
      const lastScrape = recentTasks[0]?.createdAt;
      const shouldRefresh = !lastScrape || 
        new Date().getTime() - new Date(lastScrape).getTime() > 30 * 24 * 60 * 60 * 1000;

      if (shouldRefresh && process.env.SQS_QUEUE_URL) {
        // Queue a background refresh
        queueBackgroundScrape(location.id, county, state);
      }

      return NextResponse.json({
        status: 'found',
        location: {
          id: location.id,
          county: location.county,
          state: location.state,
        },
        dataCenters,
        lastUpdated: lastScrape,
        refreshing: shouldRefresh,
      });
    }

    // Location doesn't exist, create it and queue scrape
    const [newLocation] = await locationQueries.create({ county, state });
    
    // Create scrape task
    const [scrapeTask] = await scrapeTaskQueries.create({
      locationId: newLocation.id,
      status: 'queued',
    });

    // Queue the scrape if SQS is configured
    if (process.env.SQS_QUEUE_URL) {
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify({
          taskId: scrapeTask.id,
          locationId: newLocation.id,
          county,
          state,
        }),
      }));
    }

    return NextResponse.json({
      status: 'queued',
      location: {
        id: newLocation.id,
        county: newLocation.county,
        state: newLocation.state,
      },
      taskId: scrapeTask.id,
      message: 'Gathering data center information. This may take a few minutes.',
    });

  } catch (error) {
    console.error('Lookup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function queueBackgroundScrape(locationId: string, county: string, state: string) {
  try {
    const [task] = await scrapeTaskQueries.create({
      locationId,
      status: 'queued',
    });

    await sqsClient.send(new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL!,
      MessageBody: JSON.stringify({
        taskId: task.id,
        locationId,
        county,
        state,
      }),
    }));
  } catch (error) {
    console.error('Failed to queue background scrape:', error);
  }
}