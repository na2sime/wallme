import { Pool, PoolConfig } from 'pg'

export function createPostgresPool(connectionString: string): Pool {
  const config: PoolConfig = {
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }

  const pool = new Pool(config)

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err)
  })

  return pool
}