import { z } from 'zod';

export const ScrapedDocumentSchema = z.object({
  url: z.string().url(),
  docType: z.enum(['permit', 'zoning_minutes', 'utility_filing', 'planning_doc', 'other']),
  rawContent: z.string(),
  scrapedAt: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export const ParsedDataCenterSchema = z.object({
  name: z.string().optional(),
  status: z.enum(['planned', 'under_construction', 'operational']),
  developer: z.string().optional(),
  sqft: z.number().optional(),
  powerMw: z.number().optional(),
  address: z.string().optional(),
  filingDate: z.date().optional(),
  estimatedCompletionDate: z.date().optional(),
  sourceDocuments: z.array(z.string()),
});

export const CountySourceSchema = z.object({
  name: z.string(),
  baseUrl: z.string().url(),
  searchEndpoint: z.string().optional(),
  documentSelector: z.string(),
  requiresJavaScript: z.boolean().default(true),
  searchTerms: z.array(z.string()).default(['data center', 'datacenter', 'server farm', 'colocation']),
});

export type ScrapedDocument = z.infer<typeof ScrapedDocumentSchema>;
export type ParsedDataCenter = z.infer<typeof ParsedDataCenterSchema>;
export type CountySource = z.infer<typeof CountySourceSchema>;