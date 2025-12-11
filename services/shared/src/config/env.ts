import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(env: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(env)

  if (!result.success) {
    console.error('Environment validation failed:')
    console.error(result.error.format())
    throw new Error('Invalid environment variables')
  }

  return result.data
}