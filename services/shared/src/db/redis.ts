import { createClient, RedisClientType } from 'redis'

export async function createRedisClient(url: string): Promise<RedisClientType> {
  const client = createClient({
    url,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          return new Error('Too many retries')
        }
        return retries * 100
      },
    },
  })

  client.on('error', (err) => {
    console.error('Redis Client Error', err)
  })

  await client.connect()
  console.log('Redis client connected')

  return client as RedisClientType
}