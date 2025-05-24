import { supabase } from './supabase';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

// Initialize SQS client for browser
const sqsClient = new SQSClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
  credentials: {
    // In production, these would come from a secure auth flow
    // For demo purposes, using read-only credentials
    accessKeyId: 'demo-access-key',
    secretAccessKey: 'demo-secret-key',
  },
});

export const apiClient = {
  async lookup(county: string, state: string) {
    // Check if location exists in Supabase
    const { data: locations, error: locationError } = await supabase
      .from('locations')
      .select('*')
      .eq('county', county)
      .eq('state', state)
      .single();

    if (locationError && locationError.code !== 'PGRST116') {
      throw locationError;
    }

    if (locations) {
      // Fetch data centers for this location
      const { data: dataCenters, error: dcError } = await supabase
        .from('data_centers')
        .select('*')
        .eq('location_id', locations.id);

      if (dcError) throw dcError;

      // Check last scrape
      const { data: recentTasks } = await supabase
        .from('scrape_tasks')
        .select('*')
        .eq('location_id', locations.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastScrape = recentTasks?.[0]?.created_at;
      const shouldRefresh = !lastScrape || 
        new Date().getTime() - new Date(lastScrape).getTime() > 30 * 24 * 60 * 60 * 1000;

      return {
        status: 'found' as const,
        location: locations,
        dataCenters: dataCenters || [],
        lastUpdated: lastScrape,
        refreshing: shouldRefresh,
      };
    }

    // Create new location
    const { data: newLocation, error: createError } = await supabase
      .from('locations')
      .insert({ county, state })
      .select()
      .single();

    if (createError) throw createError;

    // Create scrape task
    const { data: scrapeTask, error: taskError } = await supabase
      .from('scrape_tasks')
      .insert({
        location_id: newLocation.id,
        status: 'queued',
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Queue to SQS (in production, this would be done server-side)
    try {
      if (process.env.NEXT_PUBLIC_SQS_QUEUE_URL) {
        // For demo, just log the task
        console.log('Would queue task:', {
          taskId: scrapeTask.id,
          locationId: newLocation.id,
          county,
          state,
        });
      }
    } catch (err) {
      console.error('SQS queue error:', err);
    }

    return {
      status: 'queued' as const,
      location: newLocation,
      taskId: scrapeTask.id,
      message: 'Gathering data center information. This may take a few minutes.',
    };
  },

  async getRecentSearches() {
    // Get recent locations with successful scrapes
    const { data, error } = await supabase
      .from('locations')
      .select(`
        county,
        state,
        scrape_tasks!inner(
          created_at,
          status
        ),
        data_centers(count)
      `)
      .eq('scrape_tasks.status', 'success')
      .order('scrape_tasks.created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data?.map(location => ({
      county: location.county,
      state: location.state,
      lastSearched: location.scrape_tasks[0]?.created_at,
      datacenters: location.data_centers?.length || 0,
    })) || [];
  },
};