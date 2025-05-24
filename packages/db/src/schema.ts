import { pgTable, uuid, text, timestamp, numeric, date, jsonb, check, pgEnum, unique, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const dataStatusEnum = pgEnum('data_status', ['planned', 'under_construction', 'operational']);
export const taskStatusEnum = pgEnum('task_status', ['queued', 'running', 'success', 'error']);

export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  county: text('county').notNull(),
  state: text('state').notNull(),
  fips: text('fips'),
  geom: text('geom'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  countyStateUnique: unique().on(table.county, table.state),
  countyStateIdx: index('idx_locations_county_state').on(table.county, table.state),
}));

export const dataCenters = pgTable('data_centers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  locationId: uuid('location_id').references(() => locations.id),
  status: dataStatusEnum('status'),
  developer: text('developer'),
  sqft: numeric('sqft'),
  powerMw: numeric('power_mw'),
  firstSeen: date('first_seen', { mode: 'date' }),
  lastSeen: date('last_seen', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  locationIdx: index('idx_data_centers_location').on(table.locationId),
  statusIdx: index('idx_data_centers_status').on(table.status),
}));

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  dataCenterId: uuid('data_center_id').references(() => dataCenters.id),
  sourceUrl: text('source_url').notNull(),
  docType: text('doc_type'),
  scrapedAt: timestamp('scraped_at', { mode: 'date' }).defaultNow().notNull(),
  s3Path: text('s3_path'),
  textContent: text('text_content'),
  meta: jsonb('meta'),
}, (table) => ({
  dataCenterIdx: index('idx_documents_data_center').on(table.dataCenterId),
  sourceUrlIdx: index('idx_documents_source_url').on(table.sourceUrl),
}));

export const scrapeTasks = pgTable('scrape_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').references(() => locations.id),
  initiatedBy: uuid('initiated_by'),
  status: taskStatusEnum('status').default('queued').notNull(),
  startedAt: timestamp('started_at', { mode: 'date' }),
  finishedAt: timestamp('finished_at', { mode: 'date' }),
  log: text('log'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  locationIdx: index('idx_scrape_tasks_location').on(table.locationId),
  statusIdx: index('idx_scrape_tasks_status').on(table.status),
  createdAtIdx: index('idx_scrape_tasks_created_at').on(table.createdAt),
}));

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type DataCenter = typeof dataCenters.$inferSelect;
export type NewDataCenter = typeof dataCenters.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type ScrapeTask = typeof scrapeTasks.$inferSelect;
export type NewScrapeTask = typeof scrapeTasks.$inferInsert;