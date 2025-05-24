import { z } from 'zod';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

const envPath = resolve(__dirname, '../../../.env.local');
dotenv.config({ path: envPath });

export const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CLAUDE_API_KEY: z.string().startsWith('sk-'),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_ACCOUNT_ID: z.string().min(1),
  MAPBOX_TOKEN: z.string().startsWith('pk.').optional(),
  GH_PAT: z.string().startsWith('github_pat_').optional(),
  TERRAFORM_CLOUD_TOKEN: z.string().min(1).optional(),
  SERP_API_KEY: z.string().min(1).optional(),
  EMAIL_ALERT_SNS_TOPIC_ARN: z.string().startsWith('arn:aws:sns:').optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(): Env {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}