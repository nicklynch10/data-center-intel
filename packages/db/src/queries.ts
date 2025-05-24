import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from './client';
import { 
  locations, 
  dataCenters, 
  documents, 
  scrapeTasks,
  type NewLocation,
  type NewDataCenter,
  type NewDocument,
  type NewScrapeTask,
} from './schema';

export const locationQueries = {
  findByCountyState: async (county: string, state: string) => {
    return db
      .select()
      .from(locations)
      .where(and(
        eq(locations.county, county),
        eq(locations.state, state)
      ))
      .limit(1);
  },

  create: async (data: NewLocation) => {
    return db
      .insert(locations)
      .values(data)
      .returning();
  },

  getWithDataCenters: async (locationId: string) => {
    return db
      .select()
      .from(locations)
      .leftJoin(dataCenters, eq(dataCenters.locationId, locations.id))
      .where(eq(locations.id, locationId));
  },
};

export const dataCenterQueries = {
  findByLocation: async (locationId: string) => {
    return db
      .select()
      .from(dataCenters)
      .where(eq(dataCenters.locationId, locationId))
      .orderBy(desc(dataCenters.createdAt));
  },

  create: async (data: NewDataCenter) => {
    return db
      .insert(dataCenters)
      .values(data)
      .returning();
  },

  updateStatus: async (id: string, status: 'planned' | 'under_construction' | 'operational') => {
    return db
      .update(dataCenters)
      .set({ status })
      .where(eq(dataCenters.id, id))
      .returning();
  },
};

export const documentQueries = {
  findByDataCenter: async (dataCenterId: string) => {
    return db
      .select()
      .from(documents)
      .where(eq(documents.dataCenterId, dataCenterId))
      .orderBy(desc(documents.scrapedAt));
  },

  create: async (data: NewDocument) => {
    return db
      .insert(documents)
      .values(data)
      .returning();
  },

  findBySourceUrl: async (sourceUrl: string) => {
    return db
      .select()
      .from(documents)
      .where(eq(documents.sourceUrl, sourceUrl))
      .limit(1);
  },
};

export const scrapeTaskQueries = {
  create: async (data: NewScrapeTask) => {
    return db
      .insert(scrapeTasks)
      .values(data)
      .returning();
  },

  updateStatus: async (
    id: string, 
    status: 'queued' | 'running' | 'success' | 'error',
    log?: string
  ) => {
    const updates: any = { status };
    if (log) updates.log = log;
    if (status === 'running') updates.startedAt = new Date();
    if (status === 'success' || status === 'error') updates.finishedAt = new Date();

    return db
      .update(scrapeTasks)
      .set(updates)
      .where(eq(scrapeTasks.id, id))
      .returning();
  },

  getPending: async () => {
    return db
      .select()
      .from(scrapeTasks)
      .where(eq(scrapeTasks.status, 'queued'))
      .orderBy(scrapeTasks.createdAt)
      .limit(10);
  },

  getRecentByLocation: async (locationId: string) => {
    return db
      .select()
      .from(scrapeTasks)
      .where(eq(scrapeTasks.locationId, locationId))
      .orderBy(desc(scrapeTasks.createdAt))
      .limit(5);
  },
};