import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import { ParsedDataCenterSchema, type ParsedDataCenter, type ScrapedDocument } from '../types/index.js';

export class ClaudeParser {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
    });
  }

  async parseDocuments(documents: ScrapedDocument[]): Promise<ParsedDataCenter[]> {
    const results: ParsedDataCenter[] = [];

    for (const doc of documents) {
      try {
        const parsed = await this.parseDocument(doc);
        if (parsed) {
          results.push(parsed);
        }
      } catch (error) {
        logger.error({ error, url: doc.url }, 'Failed to parse document');
      }
    }

    return this.deduplicateResults(results);
  }

  private async parseDocument(doc: ScrapedDocument): Promise<ParsedDataCenter | null> {
    const prompt = this.buildPrompt(doc);

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        temperature: 0,
        system: `You are a data extraction specialist focused on identifying data center projects from government documents. Extract structured information about data centers mentioned in the provided document. Only extract information that is explicitly stated in the document.`,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return null;
      }

      // Extract JSON from the response
      const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        logger.warn({ url: doc.url }, 'No JSON found in Claude response');
        return null;
      }

      const rawJson = JSON.parse(jsonMatch[1]);
      
      // Validate and transform
      const validated = ParsedDataCenterSchema.safeParse({
        ...rawJson,
        sourceDocuments: [doc.url],
        filingDate: rawJson.filingDate ? new Date(rawJson.filingDate) : undefined,
        estimatedCompletionDate: rawJson.estimatedCompletionDate ? new Date(rawJson.estimatedCompletionDate) : undefined,
      });

      if (!validated.success) {
        logger.warn({ errors: validated.error.errors, url: doc.url }, 'Invalid parsed data');
        return null;
      }

      return validated.data;
    } catch (error) {
      logger.error({ error, url: doc.url }, 'Claude API error');
      return null;
    }
  }

  private buildPrompt(doc: ScrapedDocument): string {
    const contentPreview = doc.rawContent.startsWith('PDF_BINARY_SIZE:') 
      ? '[PDF Document - Binary content not shown]' 
      : doc.rawContent.substring(0, 50000); // Limit content size

    return `Please analyze the following ${doc.docType} document and extract information about any data center projects mentioned.

Document URL: ${doc.url}
Document Type: ${doc.docType}
${doc.metadata?.title ? `Title: ${doc.metadata.title}` : ''}

Content:
${contentPreview}

Extract the following information if available:
- Project name
- Current status (planned/under_construction/operational)
- Developer/Owner company name
- Size in square feet
- Power capacity in MW
- Physical address
- Filing/Approval date
- Estimated completion date

If multiple data centers are mentioned, focus on the primary one discussed.
If no data center information is found, return null.

Format your response as JSON wrapped in \`\`\`json\n...\n\`\`\` tags.

Example response:
\`\`\`json
{
  "name": "Example Data Center",
  "status": "planned",
  "developer": "Tech Corp",
  "sqft": 100000,
  "powerMw": 50,
  "address": "123 Tech Drive, City, State",
  "filingDate": "2024-01-15",
  "estimatedCompletionDate": "2025-06-01"
}
\`\`\``;
  }

  private deduplicateResults(results: ParsedDataCenter[]): ParsedDataCenter[] {
    const unique = new Map<string, ParsedDataCenter>();

    for (const result of results) {
      const key = `${result.name || 'unnamed'}-${result.developer || 'unknown'}`.toLowerCase();
      
      const existing = unique.get(key);
      if (existing) {
        // Merge source documents
        existing.sourceDocuments = [...new Set([...existing.sourceDocuments, ...result.sourceDocuments])];
        
        // Keep the most complete record
        if (!existing.address && result.address) existing.address = result.address;
        if (!existing.sqft && result.sqft) existing.sqft = result.sqft;
        if (!existing.powerMw && result.powerMw) existing.powerMw = result.powerMw;
      } else {
        unique.set(key, result);
      }
    }

    return Array.from(unique.values());
  }
}