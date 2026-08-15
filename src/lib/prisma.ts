import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { cache } from 'react'

const getDb = cache(() => {
  try {
    const { env } = getCloudflareContext() as { env: { DB?: any } }
    if (env && env.DB) {
      const adapter = new PrismaD1(env.DB)
      return new PrismaClient({ adapter: adapter as any })
    }
  } catch (e) {
    // getCloudflareContext will throw or fail outside request/Cloudflare context, e.g. during build or CLI seeds
  }

  // Fallback to local SQLite file database
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
