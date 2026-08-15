import { PrismaClient } from '@prisma/client/wasm'
import { PrismaD1 } from '@prisma/adapter-d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { cache } from 'react'

const getDb = cache(() => {
  try {
    const { env } = getCloudflareContext() as { env: { DB?: any } }
    if (env && env.DB) {
      console.log('📡 Prisma successfully connected using Cloudflare D1 adapter')
      const adapter = new PrismaD1(env.DB)
      return new PrismaClient({ adapter: adapter as any })
    } else {
      console.warn('⚠️ env.DB not found in Cloudflare context. Falling back to local SQLite client.')
    }
  } catch (e) {
    console.error('❌ Failed to retrieve Cloudflare context inside Prisma getDb:', e)
  }

  // Fallback to local SQLite file database
  console.log('🔌 Initializing fallback Node.js SQLite Prisma client')
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
})

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const db = getDb()
    const value = (db as any)[prop]
    if (typeof value === 'function') {
      return value.bind(db)
    }
    return value
  }
})
